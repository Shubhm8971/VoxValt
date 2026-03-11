import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase';
import { searchTasks, getTeamAnalytics } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Slack Webhook for /vox command
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const params = new URLSearchParams(rawBody);
        const body = Object.fromEntries(params.entries());

        // 1. Verify Slack Signature
        const signature = req.headers.get('x-slack-signature');
        const timestamp = req.headers.get('x-slack-request-timestamp');
        const signingSecret = process.env.SLACK_SIGNING_SECRET;

        if (signingSecret && signature && timestamp) {
            const hmac = crypto.createHmac('sha256', signingSecret);
            const [version, hash] = signature.split('=');
            const base = `${version}:${timestamp}:${rawBody}`;
            hmac.update(base);
            const checkHash = hmac.digest('hex');

            if (checkHash !== hash) {
                console.error('Invalid Slack signature');
                return new NextResponse('Forbidden', { status: 403 });
            }
        }

        const slackUserId = body.user_id;
        const slackTeamId = body.team_id;
        const text = (body.text || '').trim();
        const responseUrl = body.response_url;

        // 2. Identify VoxValt User & Team
        const supabase = createServerClient();

        // Find VoxValt Team mapping
        const { data: teamMapping } = await supabase
            .from('slack_teams')
            .select('voxvalt_team_id')
            .eq('slack_team_id', slackTeamId)
            .single();

        // Get user email from Slack to match with VoxValt user
        const slackToken = process.env.SLACK_BOT_TOKEN;
        let userEmail = '';

        if (slackToken) {
            const userRes = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
                headers: { 'Authorization': `Bearer ${slackToken}` }
            });
            const userData = await userRes.json();
            if (userData.ok) {
                userEmail = userData.user.profile.email;
            }
        }

        if (!userEmail) {
            return NextResponse.json({
                response_type: 'ephemeral',
                text: "I couldn't identify you. Please make sure your Slack email matches your VoxValt email."
            });
        }

        // Find VoxValt User
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single();

        if (!profile) {
            return NextResponse.json({
                response_type: 'ephemeral',
                text: "No VoxValt account found for this email. Sign up at https://voxvalt.vercel.app"
            });
        }

        const userId = profile.id;
        const voxTeamId = teamMapping?.voxvalt_team_id;

        // 3. Handle Commands
        if (text.toLowerCase() === 'pulse') {
            if (!voxTeamId) {
                return NextResponse.json({
                    response_type: 'ephemeral',
                    text: "This Slack workspace isn't linked to a VoxValt team. Link it in your dashboard settings."
                });
            }

            const analytics = await getTeamAnalytics(voxTeamId, userId);
            const pulseSummary = await generatePulseSummary(analytics);

            return NextResponse.json({
                response_type: 'in_channel',
                text: `*VoxValt Team Pulse AI* 🧠✨\n\n${pulseSummary}`
            });
        }

        // Default: RAG Search
        const query = text || "What have I promised recently?";
        const result = await performSearch(userId, query, voxTeamId);

        return NextResponse.json({
            response_type: 'in_channel',
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Query:* "${query}"\n\n${result.answer}`
                    }
                }
            ]
        });

    } catch (error) {
        console.error('Slack Webhook Error:', error);
        return NextResponse.json({
            response_type: 'ephemeral',
            text: "Something went wrong. Please try again later."
        });
    }
}

async function generatePulseSummary(analytics: any) {
    const apiKey = process.env.GOOGLE__GENERATIVE_AI_API_KEY;
    if (!apiKey) return "The team is active and on track!";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
        Summarize the following team productivity metrics for a Slack update:
        - Total Memories: ${analytics.totalMemories}
        - Completion Rate: ${Math.round(analytics.completionRate)}%
        - Reliability Score: ${Math.round(analytics.reliabilityScore)}%
        - Pending Promises: ${analytics.totalPromises - analytics.completedPromises}
        
        Keep it concise, professional, and encouraging. Return only the summary text.
    `;

    const result = await model.generateContent(prompt);
    return (await result.response).text();
}

async function performSearch(userId: string, query: string, teamId?: string) {
    const apiKey = process.env.GOOGLE__GENERATIVE_AI_API_KEY;
    if (!apiKey) return { answer: "Search is currently unavailable." };

    const genAI = new GoogleGenerativeAI(apiKey);
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(query);
    const embedding = result.embedding.values;

    const similarTasks = await searchTasks(userId, embedding, true, 0.5, 3, teamId);

    if (similarTasks.length === 0) return { answer: "I couldn't find anything related to that in your memories." };

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const context = similarTasks.map(t => `- ${t.title}: ${t.description || ''}`).join('\n');
    const prompt = `Answer the question "${query}" based on the following context:\n${context}`;

    const searchRes = await chatModel.generateContent(prompt);
    return { answer: (await searchRes.response).text() };
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { getReportData } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
        }

        // 1. Fetch recent team data (last 7 days by default in getReportData for free tier)
        const data = await getReportData(user.id, 'team', teamId);

        if (data.tasks.length === 0 && data.memories.length === 0) {
            return NextResponse.json({
                pulse: "No recent activity to report. Start by capturing some memories or tasks!"
            });
        }

        // 2. Generate Pulse Summary with Gemini
        const apiKey = process.env.GOOGLE__GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                pulse: `Summarized ${data.tasks.length} tasks and ${data.memories.length} memories.`
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const taskContext = data.tasks.map((t: any) =>
            `- ${t.title} (${t.status})`
        ).join('\n');

        const memoryContext = data.memories.map((m: any) =>
            `- ${m.content.substring(0, 100)}...`
        ).join('\n');

        const prompt = `
            You are a Team Productivity Coach for VoxValt. Analyze the following recent team activity and provide a "Pulse" summary.
            
            Team Activity:
            TASKS:
            ${taskContext}
            
            MEMORIES:
            ${memoryContext}
            
            Instructions:
            1. Provide a concise (2-3 sentences) summary of the team's progress.
            2. Highlight if the team is on track or if there are many pending tasks.
            3. Mention any key themes (e.g., "The team is focused on Project Alpha").
            4. Keep the tone encouraging and professional.
            5. Return ONLY the summary text.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const pulse = response.text();

        return NextResponse.json({ success: true, pulse });

    } catch (error: any) {
        console.error('Pulse API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

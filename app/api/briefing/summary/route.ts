import { createServerClient } from '@/lib/supabase/server'; // Ensure this matches your project structure
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE__GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `
You are the VoxValt Personal Memory Assistant. Your goal is to provide a concise, supportive morning briefing.

OUTPUT FORMAT:
Return ONLY a JSON object with these fields:
{
  "summary": "A 2-sentence max summary of the day. Use a friendly, encouraging tone.",
  "sentiment": "One word only: Productive, Calm, Overwhelmed, Creative, or Focused.",
  "priority_item": "The single most important task for today."
}

INSTRUCTIONS:
- Analyze the tone of voice memories to determine 'sentiment'. 
- If memories mention deadlines or stress, use 'Overwhelmed'. 
- If they mention ideas, use 'Creative'. 
- Otherwise, use 'Focused' or 'Calm'.
- Be brief. No greetings like "Here is your summary".
`;

export async function GET() {
    const supabase = createServerClient();

    try {
        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch User Profile & Data Context in Parallel
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const [profileRes, memoriesRes, tasksRes] = await Promise.all([
            supabase.from('profiles').select('auto_play_briefing').eq('id', user.id).single(),
            supabase.from('memories').select('content').eq('user_id', user.id).gte('created_at', yesterday.toISOString()),
            supabase.from('tasks').select('title').eq('user_id', user.id).eq('status', 'pending')
        ]);

        const memories = memoriesRes.data || [];
        const tasks = tasksRes.data || [];
        const autoPlay = profileRes.data?.auto_play_briefing ?? false;

        // 3. Prepare AI Context
        const userContext = `
      User's Recent Thoughts: ${memories.map(m => m.content).join(' | ')}
      User's Pending Tasks: ${tasks.map(t => t.title).join(', ')}
    `;

        // 4. Generate Gemini Summary
        const result = await model.generateContent([SYSTEM_PROMPT, userContext]);
        const responseText = result.response.text();

        // Clean potential Markdown formatting from Gemini's JSON response
        const cleanedJson = responseText.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(cleanedJson);

        // 5. Log the briefing in the Database
        // This allows the frontend to update 'was_read' or 'was_listened' later via the /interact API
        const { data: logEntry, error: logError } = await supabase
            .from('briefing_logs')
            .insert({
                user_id: user.id,
                briefing_text: aiData.summary,
                task_count: tasks.length,
                memory_count: memories.length,
                date_ref: new Date().toISOString().split('T')[0]
            })
            .select('id')
            .single();

        if (logError) console.error('Error logging briefing:', logError);

        // 6. Final Response
        return NextResponse.json({
            logId: logEntry?.id,
            summary: aiData.summary,
            sentiment: aiData.sentiment,
            priority: aiData.priority_item,
            autoPlay: autoPlay // Frontend uses this to trigger TTS immediately
        });

    } catch (error: any) {
        console.error('Briefing API Route Error:', error);

        // Graceful Fallback so the UI doesn't break
        return NextResponse.json({
            summary: "Good morning! I'm having trouble syncing your latest memories, but you've got this today.",
            sentiment: "Focused",
            autoPlay: false,
            logId: null
        }, { status: 200 });
    }
}
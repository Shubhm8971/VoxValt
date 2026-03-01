// app/api/briefing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE__GENERATIVE_AI_API_KEY!);

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch recent memories (last 48 hours for context)
        const since = new Date();
        since.setHours(since.getHours() - 48);

        const { data: recentMemories, error } = await supabase
            .from('memories')
            .select('content, type, created_at')
            .eq('user_id', userId)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch all open tasks and promises (no time limit)
        const { data: openItems } = await supabase
            .from('memories')
            .select('content, type, created_at')
            .eq('user_id', userId)
            .in('type', ['task', 'promise', 'reminder'])
            .order('created_at', { ascending: false })
            .limit(20);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const briefingPrompt = `You are VoxValt, a personal memory assistant generating a morning briefing.

Today's date: ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}

Recent memories (last 48 hours):
${recentMemories?.map((m) => `- [${m.type}] ${m.content} (${new Date(m.created_at).toLocaleString()})`).join('\n') || 'No recent memories.'}

Open tasks & promises:
${openItems?.map((m) => `- [${m.type}] ${m.content} (created: ${new Date(m.created_at).toLocaleDateString()})`).join('\n') || 'No open items.'}

Generate a friendly, concise morning briefing in markdown format with these sections:
## ☀️ Good Morning!
Brief greeting with date.

## 📋 Today's Focus
Top 3 most important/urgent items to address today.

## 🤝 Promises to Keep
Any commitments made to others that need attention.

## 💡 Recent Context
Key things from last 48 hours worth remembering.

## 🎯 Suggested Priority
A single recommended first action for the day.

Keep it warm, motivating, and actionable. If there are no items, suggest user record their first voice note of the day.`;

        const result = await model.generateContent(briefingPrompt);

        return NextResponse.json({
            briefing: result.response.text(),
            stats: {
                recent_memories: recentMemories?.length || 0,
                open_items: openItems?.length || 0,
            },
        });

    } catch (error: any) {
        console.error('Briefing error:', error);
        return NextResponse.json(
            { error: 'Failed to generate briefing', details: error.message },
            { status: 500 }
        );
    }
}
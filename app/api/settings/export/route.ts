// app/api/settings/export/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch all memories (without embeddings — too large)
        const { data: memories, error } = await supabase
            .from('memories')
            .select('id, content, type, status, priority, due_date, people, tags, source, created_at, updated_at, completed_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, timezone, language, briefing_time')
            .eq('id', userId)
            .single();

        const exportData = {
            exported_at: new Date().toISOString(),
            version: '1.0',
            user: {
                email: session.user.email,
                profile,
            },
            memories: memories || [],
            total: memories?.length || 0,
        };

        return NextResponse.json(exportData);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Export failed' },
            { status: 500 }
        );
    }
}
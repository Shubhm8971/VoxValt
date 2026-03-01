// app/api/boards/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOrCreateBoard } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, teamId, color, icon } = await req.json();

        if (!name || !teamId) {
            return NextResponse.json({ error: 'Name and Team ID are required' }, { status: 400 });
        }

        // We can reuse getOrCreateBoard or just create if we want specific metadata
        // For the UI, let's just use the direct insert to have more control (e.g. color)
        const { data: board, error } = await supabase
            .from('memory_boards')
            .insert({
                name,
                team_id: teamId,
                created_by: session.user.id,
                color: color || '#4F46E5',
                icon: icon || 'layout',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, board });
    } catch (error: any) {
        console.error('Create board error:', error);
        return NextResponse.json(
            { error: 'Failed to create board' },
            { status: 500 }
        );
    }
}

// app/api/boards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getBoards } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        const boards = await getBoards(teamId);

        return NextResponse.json({ boards });
    } catch (error: any) {
        console.error('Fetch boards error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch boards' },
            { status: 500 }
        );
    }
}

// app/api/teams/[teamId]/leave/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { teamId } = await params;

        // 1. Check if user is the owner (Owner cannot leave, must disband or transfer)
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('owner_id')
            .eq('id', teamId)
            .single();

        if (teamError) throw teamError;

        if (team.owner_id === session.user.id) {
            return NextResponse.json({ error: 'Owner cannot leave team. Disband the team instead.' }, { status: 400 });
        }

        // 2. Delete member record
        const { error: deleteError } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', session.user.id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Leave team error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

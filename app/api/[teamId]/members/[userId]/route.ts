// app/api/teams/[teamId]/members/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string, userId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { teamId, userId } = await params;

        // 1. Check if requester is Admin or Owner
        const { data: requesterMember, error: requesterError } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', session.user.id)
            .single();

        if (requesterError || !requesterMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('owner_id')
            .eq('id', teamId)
            .single();

        if (teamError) throw teamError;

        const isOwner = team.owner_id === session.user.id;
        const isAdmin = requesterMember.role === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Only admins or owners can remove members' }, { status: 403 });
        }

        // 2. Prevent removing the owner
        if (team.owner_id === userId) {
            return NextResponse.json({ error: 'Cannot remove the owner of the team' }, { status: 400 });
        }

        // 3. Delete member record
        const { error: deleteError } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Remove member error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

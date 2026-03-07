// app/api/teams/[teamId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
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

        // Fetch team members with user details
        const { data, error } = await supabase
            .from('team_members')
            .select(`
        role,
        joined_at,
        user:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
            .eq('team_id', teamId);

        if (error) throw error;

        return NextResponse.json({ members: data });
    } catch (error: any) {
        console.error('Team members GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
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

        // Only owner can delete
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('owner_id')
            .eq('id', teamId)
            .single();

        if (teamError) throw teamError;

        if (team.owner_id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error: deleteError } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Team DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

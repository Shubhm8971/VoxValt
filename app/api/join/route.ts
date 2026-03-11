// app/api/teams/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { inviteCode } = await req.json();

        if (!inviteCode) {
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
        }

        // 1. Find the team by invite code
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, name')
            .eq('invite_code', inviteCode)
            .single();

        if (teamError || !team) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
        }

        // 2. Check if already a member
        const { data: existingMember, error: memberCheckError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('team_id', team.id)
            .eq('user_id', session.user.id)
            .single();

        if (existingMember) {
            return NextResponse.json({ error: 'Already a member of this team' }, { status: 400 });
        }

        // 3. Add user to the team
        const { error: joinError } = await supabase
            .from('team_members')
            .insert({
                team_id: team.id,
                user_id: session.user.id,
                role: 'member'
            });

        if (joinError) throw joinError;

        return NextResponse.json({ success: true, team });
    } catch (error: any) {
        console.error('Team JOIN error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('teams')
            .select(`
        *,
        members:team_members(count)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ teams: data });
    } catch (error: any) {
        console.error('Teams GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
        }

        // 1. Create the team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({
                name,
                owner_id: session.user.id
            })
            .select()
            .single();

        if (teamError) throw teamError;

        // 2. Add creator as admin member
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: team.id,
                user_id: session.user.id,
                role: 'admin'
            });

        if (memberError) throw memberError;

        return NextResponse.json({ team });
    } catch (error: any) {
        console.error('Teams POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

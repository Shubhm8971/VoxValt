import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return new NextResponse('Unauthorized', { status: 401 });

        const { teamId } = await params;
        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('slack_teams')
            .select('*')
            .eq('voxvalt_team_id', teamId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return NextResponse.json({ success: true, slackTeam: data || null });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return new NextResponse('Unauthorized', { status: 401 });

        const { teamId } = await params;
        const { slackTeamId } = await req.json();
        const supabase = createServerClient();

        // Verify user is owner or admin of the team
        const { data: member } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .single();

        if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { data, error } = await supabase
            .from('slack_teams')
            .upsert({
                voxvalt_team_id: teamId,
                slack_team_id: slackTeamId
            }, { onConflict: 'voxvalt_team_id' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, slackTeam: data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return new NextResponse('Unauthorized', { status: 401 });

        const { teamId } = await params;
        const supabase = createServerClient();

        const { error } = await supabase
            .from('slack_teams')
            .delete()
            .eq('voxvalt_team_id', teamId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createCalendarEvent } from '@/lib/calendar-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    // Get team calendars
    const { data: calendars, error: calendarError } = await supabase
      .from('team_calendars')
      .select(`
        *,
        creator:auth.users(
          full_name,
          email
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (calendarError) {
      return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
    }

    // Get user's calendar shares
    const { data: shares, error: shareError } = await supabase
      .from('team_calendar_shares')
      .select(`
        *,
        team_calendar:team_calendars(
          id,
          calendar_name,
          calendar_color
        )
      `)
      .eq('user_id', session.user.id);

    if (shareError) {
      console.error('Calendar shares error:', shareError);
    }

    return NextResponse.json({ 
      calendars: calendars || [],
      shares: shares || []
    });

  } catch (error: any) {
    console.error('Team calendars API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { calendarId, calendarName, calendarColor = '#3788d8', isDefault = false } = body;

    if (!calendarId || !calendarName) {
      return NextResponse.json({ error: 'Calendar ID and name are required' }, { status: 400 });
    }

    // Check if user is team admin or owner
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', session.user.id)
      .single();

    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    const isAdmin = membership?.role === 'admin';
    const isOwner = team?.owner_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create team calendar
    const { data: teamCalendar, error: createError } = await supabase
      .from('team_calendars')
      .insert({
        team_id: teamId,
        calendar_id: calendarId,
        calendar_name: calendarName,
        calendar_color: calendarColor,
        is_default: isDefault,
        created_by: session.user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Team calendar creation error:', createError);
      return NextResponse.json({ error: 'Failed to create team calendar' }, { status: 500 });
    }

    // Add all team members with read access by default
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id, role')
      .eq('team_id', teamId);

    if (members && members.length > 0) {
      const shares = members.map(member => ({
        team_calendar_id: teamCalendar.id,
        user_id: member.user_id,
        permission_level: member.role === 'admin' || member.user_id === team?.owner_id ? 'write' : 'read'
      }));

      await supabase
        .from('team_calendar_shares')
        .insert(shares);
    }

    return NextResponse.json({ teamCalendar }, { status: 201 });

  } catch (error: any) {
    console.error('Team calendar creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

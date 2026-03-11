import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createCalendarEvent } from '@/lib/calendar-service';

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
    const { taskId, calendarId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('team_id', teamId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check user permissions
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

    const canSync = 
      task.user_id === session.user.id || 
      task.assigned_to === session.user.id ||
      membership?.role === 'admin' ||
      team?.owner_id === session.user.id;

    if (!canSync) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get calendar to sync to
    let targetCalendarId = calendarId;
    
    if (!targetCalendarId) {
      // Use default team calendar
      const { data: defaultCalendar } = await supabase
        .from('team_calendars')
        .select('calendar_id')
        .eq('team_id', teamId)
        .eq('is_default', true)
        .single();

      targetCalendarId = defaultCalendar?.calendar_id;
    }

    if (!targetCalendarId) {
      return NextResponse.json({ error: 'No calendar specified and no default team calendar found' }, { status: 400 });
    }

    // Get user's Google Calendar access token
    const { data: calendarAccount } = await supabase
      .from('calendar_accounts')
      .select('access_token')
      .eq('user_id', session.user.id)
      .single();

    if (!calendarAccount?.access_token) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Create calendar event
    const eventData = {
      title: task.title,
      description: `${task.description || ''}\n\n---\nTeam: ${teamId}\nTask Type: ${task.task_type || 'task'}`,
      due_date: task.due_date,
      task_type: task.task_type
    };

    const event = await createCalendarEvent(calendarAccount.access_token, eventData);

    if (!event || !event.eventId) {
      return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
    }

    // Update task with calendar event ID
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        calendar_event_id: event.eventId,
        team_calendar_id: targetCalendarId
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Task update error:', updateError);
      return NextResponse.json({ error: 'Failed to update task with calendar event ID' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      event: {
        id: event.eventId,
        htmlLink: event.eventLink
      }
    });

  } catch (error: any) {
    console.error('Team calendar sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get task with calendar event ID
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('calendar_event_id, user_id, assigned_to')
      .eq('id', taskId)
      .eq('team_id', teamId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.calendar_event_id) {
      return NextResponse.json({ error: 'Task is not synced to calendar' }, { status: 400 });
    }

    // Check permissions
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

    const canUnsync = 
      task.user_id === session.user.id || 
      task.assigned_to === session.user.id ||
      membership?.role === 'admin' ||
      team?.owner_id === session.user.id;

    if (!canUnsync) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get user's Google Calendar access token
    const { data: calendarAccount } = await supabase
      .from('calendar_accounts')
      .select('access_token')
      .eq('user_id', session.user.id)
      .single();

    if (!calendarAccount?.access_token) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Delete calendar event using Google Calendar API
    // Note: You'll need to implement deleteCalendarEvent function in calendar-service.ts
    // For now, we'll just remove the reference from the task
    
    // Update task to remove calendar event ID
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        calendar_event_id: null,
        team_calendar_id: null
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Task update error:', updateError);
      return NextResponse.json({ error: 'Failed to remove calendar sync' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Task unsynced from calendar'
    });

  } catch (error: any) {
    console.error('Team calendar unsync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

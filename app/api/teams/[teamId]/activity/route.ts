import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Get recent task activities
    const { data: taskActivities, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        completed,
        user_id,
        assigned_to,
        users!tasks_user_id_fkey (
          full_name,
          avatar_url
        ),
        assigned_user:users!tasks_assigned_to_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .or(`updated_at.gt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()},created_at.gt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (taskError) {
      console.error('Task activity error:', taskError);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Get recent member activities
    const { data: memberActivities, error: memberError } = await supabase
      .from('team_members')
      .select(`
        user_id,
        joined_at,
        users:auth.users (
          full_name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: false })
      .limit(limit);

    if (memberError) {
      console.error('Member activity error:', memberError);
    }

    // Combine and format activities
    const activities: any[] = [];

    // Process task activities
    taskActivities?.forEach((task: any) => {
      const userName = task.users?.full_name || 'Unknown User';
      
      // Task creation
      if (new Date(task.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        activities.push({
          id: `task_created_${task.id}`,
          type: 'task_created',
          userId: task.user_id,
          userName,
          userAvatar: task.users?.avatar_url,
          taskId: task.id,
          taskTitle: task.title,
          timestamp: task.created_at,
          details: task.assigned_to && task.assigned_user?.full_name 
            ? `Assigned to ${task.assigned_user.full_name}` 
            : undefined
        });
      }

      // Task completion
      if (task.completed && new Date(task.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        activities.push({
          id: `task_completed_${task.id}`,
          type: 'task_completed',
          userId: task.assigned_to || task.user_id,
          userName: task.assigned_user?.full_name || userName,
          userAvatar: task.assigned_user?.avatar_url || task.users?.avatar_url,
          taskId: task.id,
          taskTitle: task.title,
          timestamp: task.updated_at
        });
      }
    });

    // Process member activities
    memberActivities?.forEach((member: any) => {
      if (new Date(member.joined_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        activities.push({
          id: `member_joined_${member.user_id}`,
          type: 'member_joined',
          userId: member.user_id,
          userName: member.users?.full_name || 'Unknown User',
          userAvatar: member.users?.avatar_url,
          timestamp: member.joined_at
        });
      }
    });

    // Sort by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ 
      activities: activities.slice(0, limit)
    });

  } catch (error: any) {
    console.error('Team activity API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

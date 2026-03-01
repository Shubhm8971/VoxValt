// app/api/calendar/sync/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/api-auth';
import { syncTaskToCalendar } from '@/lib/calendar-sync';

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json();

    // Verify auth
    const user = await verifyAuth(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (!task.due_date) return NextResponse.json({ error: 'Task has no due date' }, { status: 400 });

    const result = await syncTaskToCalendar(user.id, task);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, eventLink: result.eventLink });

  } catch (err: any) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

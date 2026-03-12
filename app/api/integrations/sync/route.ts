import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { syncTaskToIntegrations } from '@/lib/integration-sync';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, title, description, taskType, dueDate } = await req.json();

    if (!taskId || !title) {
        return NextResponse.json({ error: 'Missing required task data' }, { status: 400 });
    }

    const results = await syncTaskToIntegrations(user.id, {
        id: taskId,
        title,
        description: description || '',
        task_type: taskType || 'task',
        due_date: dueDate || null
    });

    return NextResponse.json({
        success: true,
        results
    });

  } catch (error: any) {
    console.error('[Manual Sync] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync task' },
      { status: 500 }
    );
  }
}

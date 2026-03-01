import { NextRequest, NextResponse } from 'next/server';
import { getTasks, updateTaskStatus, updateTask, deleteTask } from '@/lib/db';
import { ApiResponse } from '@/types';
import { verifyAuth } from '@/lib/api-auth';

// GET /api/tasks - Fetch user's tasks
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const completed = searchParams.get('completed');
    const teamId = searchParams.get('teamId');
    const boardId = searchParams.get('boardId');

    const tasks = await getTasks(
      user.id,
      completed ? completed === 'true' : undefined,
      teamId || undefined,
      boardId || undefined
    );

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// PATCH /api/tasks - Update task (status or full task edit)
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, completed, title, description, task_type, due_date } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Handle full task edit (title, description, type, due_date)
    if (title !== undefined || description !== undefined || task_type !== undefined || due_date !== undefined) {
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (task_type !== undefined) updates.task_type = task_type;
      if (due_date !== undefined) updates.due_date = due_date;

      const task = await updateTask(taskId, updates);
      return NextResponse.json({
        success: true,
        data: task,
      });
    }

    // Handle status update only
    if (completed !== undefined) {
      const task = await updateTaskStatus(taskId, completed);
      return NextResponse.json({
        success: true,
        data: task,
      });
    }

    return NextResponse.json(
      { success: false, error: 'No updates provided' } as ApiResponse<null>,
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    await deleteTask(taskId);

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
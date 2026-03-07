// app/api/save-tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/api-auth';
import { saveTasks, saveRecording } from '@/lib/db';
import { Task } from '@/types';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tasks } = body as { tasks: Task[] };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks provided' },
        { status: 400 }
      );
    }

    // Create a placeholder recording (voice note without audio)
    const recording = await saveRecording(
      user.id,
      '', // No audio URL for text-only save
      tasks.map(t => t.title).join('; '),
      0, // No duration
      undefined,
      undefined
    );

    // Convert Task[] to saveTasks format
    const tasksToSave = tasks.map(task => ({
      title: task.title,
      description: task.description || '',
      task_type: task.type as 'task' | 'reminder' | 'promise' | 'recurring',
      due_date: task.due_date || undefined,
      recurrence: null
    }));

    // Save tasks
    const savedTasks = await saveTasks(
      user.id,
      recording.id,
      tasksToSave
    );

    return NextResponse.json({
      success: true,
      saved: savedTasks.length,
      recordingId: recording.id,
      message: `Saved ${savedTasks.length} task(s)`
    });
  } catch (error) {
    console.error('[API] Error saving tasks:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to save tasks',
        message: 'An error occurred while saving tasks'
      },
      { status: 500 }
    );
  }
}

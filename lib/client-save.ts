// Client-side task saving (works with or without auth)
import { Task } from '@/types';

interface SaveTasksOptions {
  userId: string;
  tasks: Task[];
  sessionToken?: string;
}

export async function saveTasksToDatabase(options: SaveTasksOptions): Promise<{
  success: boolean;
  message: string;
  saved: number;
}> {
  const { userId, tasks, sessionToken } = options;

  // Demo mode: save to localStorage
  if (userId === 'demo') {
    try {
      const stored = localStorage.getItem('voxvalt_demo_tasks') || '[]';
      const all = JSON.parse(stored);
      const newTasks = tasks.map(t => ({
        ...t,
        id: Math.random().toString(36).slice(2),
        created_at: new Date().toISOString(),
        status: 'saved_locally'
      }));
      all.push(...newTasks);
      localStorage.setItem('voxvalt_demo_tasks', JSON.stringify(all));
      return {
        success: true,
        message: `Saved ${newTasks.length} task(s) locally (demo mode)`,
        saved: newTasks.length
      };
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      return {
        success: false,
        message: 'Failed to save tasks locally',
        saved: 0
      };
    }
  }

  // Authenticated mode: save to database via API
  try {
    const response = await fetch('/api/save-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
      },
      body: JSON.stringify({
        tasks,
        userId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to save tasks',
        saved: 0
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: `Saved ${result.saved} task(s) to VoxValt`,
      saved: result.saved
    };
  } catch (err) {
    console.error('Error saving tasks:', err);
    return {
      success: false,
      message: 'Failed to save tasks to database',
      saved: 0
    };
  }
}

// Retrieve demo tasks from localStorage
export function getDemoTasks(): any[] {
  try {
    const stored = localStorage.getItem('voxvalt_demo_tasks') || '[]';
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Clear demo tasks
export function clearDemoTasks(): void {
  localStorage.removeItem('voxvalt_demo_tasks');
}

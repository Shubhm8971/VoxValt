// lib/todoist-service.ts
import { TodoistApi } from '@doist/todoist-api-typescript';

export interface TodoistTokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Generate Todoist OAuth authorization URL
 */
export function getTodoistAuthUrl(): string {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_TODOIST_CALLBACK_URL;
  
  if (!clientId || !redirectUri) {
    throw new Error('Todoist OAuth credentials are missing in environment variables');
  }

  // Generate a random state string for security
  const state = Math.random().toString(36).substring(7);

  // Todoist OAuth requires the 'data:read_write' scope to create tasks
  return `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=data:read_write&state=${state}`;
}

/**
 * Exchange the authorization code for an access token
 */
export async function getTodoistTokensFromCode(code: string): Promise<TodoistTokenResponse> {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const clientSecret = process.env.TODOIST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Todoist OAuth credentials are missing');
  }

  const response = await fetch('https://todoist.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  });

  if (!response.ok) {
    const textData = await response.text();
    console.error('Todoist Token Error:', textData);
    throw new Error(`Failed to get Todoist token: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all active projects for the user
 */
export async function getUserTodoistProjects(accessToken: string) {
  const api = new TodoistApi(accessToken);

  try {
    const projects = await api.getProjects();
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      isInbox: p.isInboxProject,
    }));
  } catch (error) {
    console.error('Error fetching Todoist projects:', error);
    throw new Error('Failed to fetch Todoist projects');
  }
}

/**
 * Create a new task in Todoist
 */
export async function createTodoistTask(
  accessToken: string,
  projectId: string | null, // null means Inbox
  taskData: {
    title: string;
    description?: string;
    due_date?: string;
    task_type?: string;
  }
) {
  const api = new TodoistApi(accessToken);

  try {
    // Map properties for Todoist
    const args: any = {
      content: taskData.title,
      description: taskData.description || '',
    };

    if (projectId) {
      args.projectId = projectId;
    }

    // Set due date
    if (taskData.due_date) {
      // Todoist supports "dueString" (e.g., "tomorrow at 12") or "dueDate" (YYYY-MM-DD) or "dueDatetime" (RFC3339)
      // VoxValt's extractors return full ISO dates typically.
      if (taskData.due_date.includes('T')) {
         args.dueDatetime = taskData.due_date;
      } else {
         args.dueDate = taskData.due_date.split('T')[0]; // Extract YYYY-MM-DD
      }
    }

    // Optional tags/labels based on type
    if (taskData.task_type) {
        // NOTE: Todoist labels must exist before attaching them by name. 
        // We'll skip forcing labels natively here to avoid crashes, 
        // but we append the type to the description as a fallback.
        args.description += `\n\nType: ${taskData.task_type}`;
    }

    const task = await api.addTask(args);

    return {
      success: true,
      taskId: task.id,
      url: task.url,
    };
  } catch (error: any) {
    console.error('Error creating Todoist task:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Todoist task'
    }
  }
}

import { createAdminClient } from './supabase';
import { syncTaskToCalendar } from './calendar-sync';
import { createNotionTask } from './notion-service';
import { createTodoistTask } from './todoist-service';

export interface SyncResponse {
  provider: string;
  success: boolean;
  error?: string;
  url?: string;
}

/**
 * Pushes a single task to all connected and enabled integrations for a specific user.
 * 
 * @param userId The ID of the user who owns the task
 * @param task The task data to be synced
 * @returns An array of results from each provider
 */
export async function syncTaskToIntegrations(
  userId: string,
  task: {
    id: string; // The VoxValt internal task ID
    title: string;
    description: string;
    task_type: 'task' | 'reminder' | 'promise' | 'recurring';
    due_date?: string | null;
  }
): Promise<SyncResponse[]> {
  const supabase = createAdminClient();
  const results: SyncResponse[] = [];

  try {
    // 1. Fetch all connected integrations for this user
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[SYNC] Failed to fetch integrations:', error);
      return results;
    }

    // 2. Loop through each integration and dispatch to the correct service
    for (const integration of integrations || []) {
      const accessToken = integration.access_token;
      
      switch (integration.provider) {
        // ------------------------------------------------------------------
        // GOOGLE CALENDAR
        // ------------------------------------------------------------------
        case 'google':
             // The old calendar logic in `calendar-sync.ts` already handles the specifics,
             // including refreshing tokens. We just call it.
             const googleResult = await syncTaskToCalendar(userId, {
                 id: task.id,
                 title: task.title,
                 description: task.description,
                 due_date: task.due_date || undefined,
                 task_type: task.task_type
             });

             results.push({
                 provider: 'google',
                 success: googleResult.success,
                 error: googleResult.error,
                 url: googleResult.eventLink
             });
             break;

        // ------------------------------------------------------------------
        // NOTION
        // ------------------------------------------------------------------
        case 'notion':
            // Get the default database from settings, or fail gracefully
            const notionDbId = integration.settings?.default_database_id;
            
            if (!notionDbId) {
                results.push({
                    provider: 'notion',
                    success: false,
                    error: 'No default database selected in Notion settings'
                });
                break;
            }

            const notionResult = await createNotionTask(accessToken, notionDbId, {
                title: task.title,
                description: task.description,
                due_date: task.due_date || undefined,
                task_type: task.task_type
            });

            results.push({
                provider: 'notion',
                success: notionResult.success,
                error: notionResult.error,
                url: notionResult.url
            });
            break;

        // ------------------------------------------------------------------
        // TODOIST
        // ------------------------------------------------------------------
        case 'todoist':
             // If projectId is null, Todoist puts it in the Inbox.
             const todoistProjectId = integration.settings?.default_project_id || null;

             const todoistResult = await createTodoistTask(accessToken, todoistProjectId, {
                 title: task.title,
                 description: task.description,
                 due_date: task.due_date || undefined,
                 task_type: task.task_type
             });

             results.push({
                 provider: 'todoist',
                 success: todoistResult.success,
                 error: todoistResult.error,
                 url: todoistResult.url
             });
             break;
             
        default:
            console.warn(`[SYNC] Unknown provider: ${integration.provider}`);
      }
    }

    // 3. Update the original Task in the database to mark where it was synced
    if (results.some(r => r.success)) {
        // Fetch current `synced_to` array
        const { data: currentTask } = await supabase
            .from('tasks')
            .select('synced_to')
            .eq('id', task.id)
            .single();

        const currentLinks = currentTask?.synced_to || [];
        
        // Append new successful syncs
        const newLinks = results
            .filter(r => r.success && r.url)
            .map(r => ({ provider: r.provider, url: r.url }));
            
        await supabase
            .from('tasks')
            .update({
                synced_to: [...currentLinks, ...newLinks]
            })
            .eq('id', task.id);
    }

  } catch (error) {
    console.error('[SYNC] Global sync error:', error);
  }

  return results;
}

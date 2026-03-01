// lib/calendar-sync.ts
import { supabase } from './supabase';
import {
    createCalendarEvent,
    verifyAndRefreshToken
} from './calendar-service';

export interface SyncResult {
    success: boolean;
    eventLink?: string;
    error?: string;
}

/**
 * Synchronize a task with Google Calendar
 */
export async function syncTaskToCalendar(userId: string, task: {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    task_type?: string;
}): Promise<SyncResult> {
    try {
        // 1. Get calendar credentials
        const { data: account, error: accountError } = await supabase
            .from('calendar_accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('provider', 'google')
            .single();

        if (accountError || !account) {
            return { success: false, error: 'Calendar not connected' };
        }

        // 2. Verify and refresh token
        const tokens = await verifyAndRefreshToken(account.access_token, account.refresh_token);

        // If token was refreshed, update the DB
        if (tokens.access_token !== account.access_token) {
            await supabase
                .from('calendar_accounts')
                .update({
                    access_token: tokens.access_token,
                    token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : (account.token_expiry || null),
                    updated_at: new Date().toISOString()
                })
                .eq('id', account.id);
        }

        // 3. Create the event
        const result = await createCalendarEvent(tokens.access_token!, {
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            task_type: task.task_type
        });

        // 4. Update the task with the event ID/link if needed
        // Assuming tasks table has google_event_id or similar
        // For now, just return success
        return {
            success: true,
            eventLink: result.eventLink || undefined
        };

    } catch (error: any) {
        console.error('[CALENDAR_SYNC] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync multiple tasks (useful for batch processing)
 */
export async function syncMultipleTasks(userId: string, tasks: any[]): Promise<SyncResult[]> {
    const results = [];
    for (const task of tasks) {
        // Only sync if there's a due date
        if (task.due_date) {
            results.push(await syncTaskToCalendar(userId, task));
        }
    }
    return results;
}

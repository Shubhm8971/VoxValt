/**
 * Notification Scheduler (Server-side)
 * Manages scheduling and persistence of notifications in the database
 */

import { Task } from '@/types';
import { scheduleNotification } from './db';
import { parseISO, subMinutes, format } from 'date-fns';

export class NotificationScheduler {
  /**
   * Schedule a notification for a task
   */
  static async scheduleTask(userId: string, task: Task, leadTimeMinutes: number = 15): Promise<void> {
    if (!task.due_date || !task.id) return;

    try {
      const dueDate = parseISO(task.due_date);
      const scheduledFor = subMinutes(dueDate, leadTimeMinutes);

      // Don't schedule if it's already in the past
      if (scheduledFor.getTime() < Date.now()) return;

      await scheduleNotification(userId, {
        taskId: task.id,
        title: `Upcoming Task: ${task.title}`,
        body: `Don't forget: ${task.title} is due at ${format(dueDate, 'p')}`,
        scheduled_for: scheduledFor.toISOString(),
        type: 'task_reminder'
      });

      console.log(`[NotificationScheduler] Scheduled task reminder for ${task.id} at ${scheduledFor.toISOString()}`);
    } catch (error) {
      console.error('[NotificationScheduler] Failed to schedule task notification:', error);
    }
  }

  /**
   * Schedule a notification for a "Promise" (Commitment)
   */
  static async scheduleCommitment(userId: string, memory: any, leadTimeMinutes: number = 30): Promise<void> {
    if (!memory.due_date || !memory.id) return;

    try {
      const dueDate = parseISO(memory.due_date);
      const scheduledFor = subMinutes(dueDate, leadTimeMinutes);

      if (scheduledFor.getTime() < Date.now()) return;

      await scheduleNotification(userId, {
        memoryId: memory.id,
        title: `Commitment Reminder: ${memory.content.substring(0, 50)}...`,
        body: `You promised: "${memory.content.substring(0, 100)}${memory.content.length > 100 ? '...' : ''}"`,
        scheduled_for: scheduledFor.toISOString(),
        type: 'commitment'
      });

      console.log(`[NotificationScheduler] Scheduled commitment notification for ${memory.id} at ${scheduledFor.toISOString()}`);
    } catch (error) {
      console.error('[NotificationScheduler] Failed to schedule commitment notification:', error);
    }
  }

  /**
   * Sync notifications for multiple tasks
   */
  static async syncTasks(userId: string, tasks: Task[]): Promise<void> {
    // In a real DB-backed system, we might want to clear existing ones first or do upserts
    // For simplicity in this implementation, we just try to schedule them.
    // The DB constraint/uniqueness or a separate cleanup step would handle duplicates.
    for (const task of tasks) {
      if (!task.completed) {
        await this.scheduleTask(userId, task);
      }
    }
  }
}

export default NotificationScheduler;

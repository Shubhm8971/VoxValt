import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';
import { differenceInMinutes, parseISO, isPast, isFuture, format } from 'date-fns';

interface NotificationSettings {
  enabled: boolean;
  permission: NotificationPermission;
  leadTimeMinutes: number; // How many minutes before due date to notify
  sound: boolean;
  morningBriefing: boolean; // Enable morning briefing
  morningBriefingTime: string; // "09:00"
}

export function useNotifications(userId: string) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    permission: 'default',
    leadTimeMinutes: 15,
    sound: true,
    morningBriefing: true,
    morningBriefingTime: "09:00",
  });

  // Track notified tasks to prevent duplicate alerts
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
  // Track if morning briefing was sent today (store date string "YYYY-MM-DD")
  const [lastBriefingDate, setLastBriefingDate] = useState<string | null>(null);

  // Load persisted settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      // Load from localStorage
      const savedSettings = localStorage.getItem(`notifications_${userId}`);
      const savedBriefingDate = localStorage.getItem(`briefing_date_${userId}`);

      if (savedBriefingDate) {
        setLastBriefingDate(savedBriefingDate);
      }

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsed,
            permission: Notification.permission,
            enabled: Notification.permission === 'granted'
          }));
        } catch (e) {
          console.error('Failed to load notification settings:', e);
        }
      } else {
        // Initialize with current permission
        if ('Notification' in window) {
          setSettings(prev => ({
            ...prev,
            permission: Notification.permission,
            enabled: Notification.permission === 'granted'
          }));
        }
      }
    }
  }, [userId]);


  useEffect(() => {
    // Check initial permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSettings(prev => ({
        ...prev,
        permission: Notification.permission,
        enabled: Notification.permission === 'granted'
      }));
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      const newSettings: NotificationSettings = {
        ...settings,
        permission,
        enabled: permission === 'granted',
      };
      setSettings(newSettings);

      // Persist settings
      if (userId && typeof window !== 'undefined') {
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(newSettings));
      }

      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Update notification settings
  const updateSettings = useCallback((updates: Partial<Omit<NotificationSettings, 'permission'>>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      // Persist to localStorage
      if (userId && typeof window !== 'undefined') {
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(newSettings));
      }
      return newSettings;
    });
  }, [userId]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (settings.permission === 'granted') {
      new Notification(title, {
        icon: '/icon.png', // Ensure you have an icon in public folder or remove this line
        badge: '/icon.png',
        ...options
      });
    }
  }, [settings.permission]);

  const checkAndNotifyUpcomingTasks = useCallback((tasks: Task[]) => {
    if (settings.permission !== 'granted' || !settings.enabled) return;

    const now = new Date();
    const leadTime = settings.leadTimeMinutes || 15;
    const todayStr = format(now, 'yyyy-MM-dd');

    // --- Morning Briefing Logic ---
    if (settings.morningBriefing && lastBriefingDate !== todayStr) {
      const [briefingHour, briefingMinute] = settings.morningBriefingTime.split(':').map(Number);

      // Check if it's time for briefing (e.g., after 9:00 AM)
      if (now.getHours() > briefingHour || (now.getHours() === briefingHour && now.getMinutes() >= briefingMinute)) {

        // Count tasks due today
        const tasksToday = tasks.filter(t => t.due_date && t.due_date.startsWith(todayStr) && !t.completed);
        const promisesToday = tasksToday.filter(t => t.task_type === 'promise' || t.type === 'promise');

        if (tasksToday.length > 0) {
          const title = `☀️ Morning Briefing`;
          const body = `You have ${tasksToday.length} tasks and ${promisesToday.length} promises due today. Good luck!`;

          new Notification(title, {
            body,
            icon: '/icon.png',
            tag: 'morning_briefing'
          });

          // Mark as sent for today
          setLastBriefingDate(todayStr);
          localStorage.setItem(`briefing_date_${userId}`, todayStr);
        }
      }
    }

    // --- Task & Promise Alert Logic ---
    tasks.forEach(task => {
      if (!task.due_date || task.completed || notifiedTaskIds.has(task.id || '')) return;

      try {
        const dueDate = parseISO(task.due_date);
        const minutesUntilDue = differenceInMinutes(dueDate, now);

        // Notify if:
        // 1. Task is approaching (within lead time window)
        // 2. Task hasn't been notified yet this session
        const shouldNotify = minutesUntilDue <= leadTime && minutesUntilDue >= -5;

        if (shouldNotify) {
          let title = '';
          let body = '';
          let tag = `task_${task.id}`;
          const isPromise = task.task_type === 'promise' || task.type === 'promise';

          if (minutesUntilDue > 5) {
            title = isPromise ? `🤞 Promise Due: ${task.title}` : `📋 Upcoming: ${task.title}`;
            body = `Due in ${minutesUntilDue} minutes - ${format(dueDate, 'h:mm a')}`;
          } else if (minutesUntilDue > 0) {
            title = isPromise ? `🤞 PROMISE DUE SOON: ${task.title}` : `⏰ Due Soon: ${task.title}`;
            body = `Due in less than 5 minutes!`;
          } else {
            title = isPromise ? `🔴 PROMISE OVERDUE: ${task.title}` : `🔴 Due Now: ${task.title}`;
            body = `This ${isPromise ? 'promise' : 'task'} is overdue!`;
          }

          // Send with platform-specific options
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Use service worker for persistent notifications
            const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
              body,
              icon: '/icon.png',
              badge: '🎙️',
              tag,
              requireInteraction: minutesUntilDue <= 0 || isPromise, // Promises require interaction
              data: {
                taskId: task.id,
                title: task.title,
                dueDate: task.due_date
              }
            };

            // Add vibration if sound is enabled
            if (settings.sound) {
              (notificationOptions as any).vibrate = [200, 100, 200];
            }

            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              payload: { title, options: notificationOptions }
            });
          } else {
            // Fallback to standard notification
            const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
              body,
              icon: '/icon.png',
              badge: '🎙️',
              tag,
              requireInteraction: minutesUntilDue <= 0 || isPromise,
            };

            // Add vibration if sound is enabled
            if (settings.sound) {
              (notificationOptions as any).vibrate = [200, 100, 200];
            }

            new Notification(title, notificationOptions);
          }

          // Mark as notified
          setNotifiedTaskIds(prev => new Set(prev).add(task.id || ''));
        }
      } catch (error) {
        console.error('Error checking task notification:', task, error);
      }
    });
  }, [settings, notifiedTaskIds, lastBriefingDate, userId]); // Updated dependencies

  return {
    settings,
    requestPermission,
    sendNotification,
    checkAndNotifyUpcomingTasks,
    updateSettings
  };
}

export default useNotifications;

// app/components/ServiceWorkerInitializer.tsx
'use client';

import { useEffect, useCallback, useRef } from 'react';

// Custom events that components can listen to
export const SW_EVENTS = {
  MEMORY_COMPLETED: 'voxvalt:memory-completed',
  MEMORY_SNOOZED: 'voxvalt:memory-snoozed',
  RECORDING_SYNCED: 'voxvalt:recording-synced',
  NOTIFICATION_CLICKED: 'voxvalt:notification-clicked',
  SW_UPDATED: 'voxvalt:sw-updated',
  ONLINE_STATUS: 'voxvalt:online-status',
} as const;

export default function ServiceWorkerInitializer() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // Register Service Worker
  // ============================================
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('[VoxValt] Service Workers not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for SW updates
      });

      registrationRef.current = registration;
      console.log('[VoxValt] ✅ Service Worker registered:', registration.scope);

      // Handle updates
      handleServiceWorkerUpdates(registration);

      // Check for updates periodically (every 30 minutes)
      updateCheckIntervalRef.current = setInterval(() => {
        registration.update().catch((err) => {
          console.warn('[VoxValt] SW update check failed:', err);
        });
      }, 30 * 60 * 1000);

      // Register periodic background sync (Chromium only)
      await registerPeriodicSync(registration);

      // Register background sync for offline support
      await registerBackgroundSync(registration);

    } catch (error) {
      console.warn('[VoxValt] ⚠️ Service Worker registration failed:', error);
    }
  }, []);

  // ============================================
  // Handle SW Updates (new version available)
  // ============================================
  const handleServiceWorkerUpdates = useCallback(
    (registration: ServiceWorkerRegistration) => {
      // New SW installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        console.log('[VoxValt] New Service Worker found, installing...');

        newWorker.addEventListener('statechange', () => {
          switch (newWorker.state) {
            case 'installed':
              if (navigator.serviceWorker.controller) {
                // New version available — old one still controls page
                console.log('[VoxValt] ✨ New version available');

                // Dispatch event so UI can show update prompt
                window.dispatchEvent(
                  new CustomEvent(SW_EVENTS.SW_UPDATED, {
                    detail: {
                      registration,
                      skipWaiting: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                      },
                    },
                  })
                );
              } else {
                // First install — content cached for offline
                console.log('[VoxValt] Content cached for offline use');
              }
              break;

            case 'activated':
              console.log('[VoxValt] New Service Worker activated');
              break;

            case 'redundant':
              console.log('[VoxValt] Service Worker became redundant');
              break;
          }
        });
      });

      // When a new SW takes over, reload to get fresh content
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('[VoxValt] New SW controller, reloading page...');
        window.location.reload();
      });
    },
    []
  );

  // ============================================
  // Register Periodic Sync (Chromium browsers)
  // Used for: morning briefings, reminder checks
  // ============================================
  const registerPeriodicSync = useCallback(
    async (registration: ServiceWorkerRegistration) => {
      if (!('periodicSync' in registration)) {
        console.log('[VoxValt] Periodic Background Sync not supported');
        return;
      }

      try {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName,
        });

        if (status.state !== 'granted') {
          console.log('[VoxValt] Periodic sync permission not granted');
          return;
        }

        const periodicSync = (registration as any).periodicSync;

        // Morning briefing check (every 12 hours)
        await periodicSync.register('morning-briefing', {
          minInterval: 12 * 60 * 60 * 1000,
        });

        // Reminder check (every 30 minutes)
        await periodicSync.register('check-reminders', {
          minInterval: 30 * 60 * 1000,
        });

        console.log('[VoxValt] ✅ Periodic sync registered');
      } catch (err) {
        console.log('[VoxValt] Periodic sync registration failed:', err);
      }
    },
    []
  );

  // ============================================
  // Register Background Sync (offline support)
  // Used for: syncing recordings & completions made offline
  // ============================================
  const registerBackgroundSync = useCallback(
    async (registration: ServiceWorkerRegistration) => {
      if (!('sync' in registration)) {
        console.log('[VoxValt] Background Sync not supported');
        return;
      }

      // Only register sync if we're coming back online
      // Initial sync registrations happen when going offline → online
      console.log('[VoxValt] ✅ Background Sync available');
    },
    []
  );

  // ============================================
  // Listen for Messages from Service Worker
  // ============================================
  const setupMessageListener = useCallback(() => {
    if (!navigator.serviceWorker) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, ...data } = event.data || {};

      switch (type) {
        // Memory was completed via notification action
        case 'MEMORY_COMPLETED':
          console.log('[VoxValt] Memory completed via notification:', data.memoryId);
          window.dispatchEvent(
            new CustomEvent(SW_EVENTS.MEMORY_COMPLETED, {
              detail: {
                memoryId: data.memoryId,
                action: 'completed',
              },
            })
          );
          break;

        // Memory was snoozed via notification action
        case 'MEMORY_SNOOZED':
          console.log('[VoxValt] Memory snoozed via notification:', data.memoryId);
          window.dispatchEvent(
            new CustomEvent(SW_EVENTS.MEMORY_SNOOZED, {
              detail: {
                memoryId: data.memoryId,
                snoozeMinutes: data.snoozeMinutes || 60,
              },
            })
          );
          break;

        // Offline recording was synced successfully
        case 'RECORDING_SYNCED':
          console.log('[VoxValt] Offline recording synced:', data.id);
          window.dispatchEvent(
            new CustomEvent(SW_EVENTS.RECORDING_SYNCED, {
              detail: { recordingId: data.id },
            })
          );
          break;

        // User clicked on a notification (not an action button)
        case 'NOTIFICATION_CLICKED':
          console.log('[VoxValt] Notification clicked:', data);
          window.dispatchEvent(
            new CustomEvent(SW_EVENTS.NOTIFICATION_CLICKED, {
              detail: {
                url: data.url,
                memoryId: data.memoryId || data.taskId,
                notificationType: data.notificationType,
              },
            })
          );

          // Handle specific navigation based on notification data
          if (data.url && data.url !== window.location.pathname) {
            window.location.href = data.url;
          }
          break;

        default:
          console.log('[VoxValt] Unknown SW message:', type, data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // ============================================
  // Detect PWA Standalone Mode
  // ============================================
  const detectStandaloneMode = useCallback(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      document.documentElement.classList.add('pwa-standalone');
      document.body.classList.add('pwa-mode');
      console.log('[VoxValt] 📱 Running as installed PWA');
    }

    // Listen for display mode changes (user installs/uninstalls PWA)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('pwa-standalone');
        document.body.classList.add('pwa-mode');
        console.log('[VoxValt] 📱 App installed as PWA');
      } else {
        document.documentElement.classList.remove('pwa-standalone');
        document.body.classList.remove('pwa-mode');
      }
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // ============================================
  // Online/Offline Status Detection
  // ============================================
  const setupNetworkDetection = useCallback(() => {
    const updateOnlineStatus = (isOnline: boolean) => {
      if (isOnline) {
        document.body.classList.remove('is-offline');
        document.body.classList.add('is-online');
        console.log('[VoxValt] 🟢 Back online');

        // Trigger background sync for any pending operations
        if (registrationRef.current && 'sync' in registrationRef.current) {
          const sync = (registrationRef.current as any).sync;

          sync.register('sync-recordings').catch((err: Error) => {
            console.log('[VoxValt] Sync registration (recordings) failed:', err);
          });

          sync.register('sync-completions').catch((err: Error) => {
            console.log('[VoxValt] Sync registration (completions) failed:', err);
          });
        }
      } else {
        document.body.classList.add('is-offline');
        document.body.classList.remove('is-online');
        console.log('[VoxValt] 🔴 Gone offline');
      }

      // Dispatch event for components
      window.dispatchEvent(
        new CustomEvent(SW_EVENTS.ONLINE_STATUS, {
          detail: { isOnline },
        })
      );
    };

    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    if (!navigator.onLine) {
      document.body.classList.add('is-offline');
    } else {
      document.body.classList.add('is-online');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================
  // Handle PWA Install Prompt
  // ============================================
  const setupInstallPrompt = useCallback(() => {
    let deferredPrompt: any = null;

    const handleBeforeInstall = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      deferredPrompt = e;

      console.log('[VoxValt] 📲 Install prompt available');

      // Dispatch event so UI can show custom install button
      window.dispatchEvent(
        new CustomEvent('voxvalt:install-available', {
          detail: {
            prompt: async () => {
              if (!deferredPrompt) return false;

              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              console.log('[VoxValt] Install prompt outcome:', outcome);

              deferredPrompt = null;
              return outcome === 'accepted';
            },
          },
        })
      );
    };

    const handleAppInstalled = () => {
      console.log('[VoxValt] 🎉 App installed successfully!');
      deferredPrompt = null;

      window.dispatchEvent(new CustomEvent('voxvalt:app-installed'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ============================================
  // Handle URL action params (from manifest shortcuts)
  // ============================================
  const handleURLActions = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    // From manifest shortcut: /?action=record
    const action = params.get('action');
    if (action) {
      console.log('[VoxValt] URL action:', action);
      window.dispatchEvent(
        new CustomEvent('voxvalt:url-action', {
          detail: { action },
        })
      );
    }

    // From notification: /?complete=memoryId
    const completeId = params.get('complete');
    if (completeId) {
      window.dispatchEvent(
        new CustomEvent(SW_EVENTS.MEMORY_COMPLETED, {
          detail: { memoryId: completeId, action: 'completed' },
        })
      );

      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // From notification: /?showBriefing=true
    const showBriefing = params.get('showBriefing');
    if (showBriefing === 'true') {
      window.dispatchEvent(new CustomEvent('voxvalt:show-briefing'));

      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // From PWA install: /?source=pwa
    const source = params.get('source');
    if (source === 'pwa') {
      console.log('[VoxValt] Launched from PWA');
    }
  }, []);

  // ============================================
  // Main Effect - Initialize Everything
  // ============================================
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Set up all listeners
    const cleanupMessage = setupMessageListener();
    const cleanupStandalone = detectStandaloneMode();
    const cleanupNetwork = setupNetworkDetection();
    const cleanupInstall = setupInstallPrompt();

    // Handle URL actions (from shortcuts, notifications)
    handleURLActions();

    // Cleanup
    return () => {
      cleanupMessage?.();
      cleanupStandalone?.();
      cleanupNetwork?.();
      cleanupInstall?.();

      if (updateCheckIntervalRef.current) {
        clearInterval(updateCheckIntervalRef.current);
      }
    };
  }, [
    registerServiceWorker,
    setupMessageListener,
    detectStandaloneMode,
    setupNetworkDetection,
    setupInstallPrompt,
    handleURLActions,
  ]);

  // This component doesn't render anything
  return null;
}
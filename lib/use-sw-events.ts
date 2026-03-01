// lib/use-sw-events.ts
'use client';

import { useEffect, useCallback, useState } from 'react';
import { SW_EVENTS } from '@/app/components/ServiceWorkerInitializer';

// Re-export SW_EVENTS for other modules
export { SW_EVENTS };

type SWEventType = (typeof SW_EVENTS)[keyof typeof SW_EVENTS];

/**
 * Hook to listen for Service Worker events in any component
 *
 * Usage:
 *   useSWEvent('voxvalt:memory-completed', (detail) => {
 *     console.log('Memory completed:', detail.memoryId);
 *     refreshMemories();
 *   });
 */
export function useSWEvent(
    eventName: SWEventType | string,
    handler: (detail: any) => void,
    deps: any[] = []
) {
    const stableHandler = useCallback(handler, deps);

    useEffect(() => {
        const listener = (event: Event) => {
            const customEvent = event as CustomEvent;
            stableHandler(customEvent.detail);
        };

        window.addEventListener(eventName, listener);

        return () => {
            window.removeEventListener(eventName, listener);
        };
    }, [eventName, stableHandler]);
}

/**
 * Hook to get current online status and listen for changes
 *
 * Usage:
 *   const isOnline = useOnlineStatus();
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
        }
    }, []);

    useSWEvent(SW_EVENTS.ONLINE_STATUS, (detail) => {
        setIsOnline(detail.isOnline);
    });

    return isOnline;
}

/**
 * Hook to handle PWA install prompt
 *
 * Usage:
 *   const { canInstall, install } = useInstallPrompt();
 *   if (canInstall) return <button onClick={install}>Install App</button>
 */
export function useInstallPrompt() {
    const [canInstall, setCanInstall] = useState(false);
    const [promptFn, setPromptFn] = useState<(() => Promise<boolean>) | null>(null);

    useEffect(() => {
        const handleAvailable = (event: Event) => {
            const customEvent = event as CustomEvent;
            setCanInstall(true);
            setPromptFn(() => customEvent.detail.prompt);
        };

        const handleInstalled = () => {
            setCanInstall(false);
            setPromptFn(null);
        };

        window.addEventListener('voxvalt:install-available', handleAvailable);
        window.addEventListener('voxvalt:app-installed', handleInstalled);

        return () => {
            window.removeEventListener('voxvalt:install-available', handleAvailable);
            window.removeEventListener('voxvalt:app-installed', handleInstalled);
        };
    }, []);

    const install = useCallback(async () => {
        if (promptFn) {
            const accepted = await promptFn();
            if (accepted) setCanInstall(false);
            return accepted;
        }
        return false;
    }, [promptFn]);

    return { canInstall, install };
}


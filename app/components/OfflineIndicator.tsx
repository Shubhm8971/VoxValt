// app/components/OfflineIndicator.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSWEvent, SW_EVENTS } from '@/lib/use-sw-events';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (typeof navigator !== 'undefined') {
            setIsOffline(!navigator.onLine);
        }
    }, []);

    useSWEvent(
        SW_EVENTS.ONLINE_STATUS,
        (detail) => {
            if (detail.isOnline && isOffline) {
                // Was offline, now back online — show reconnection message
                setShowReconnected(true);
                setTimeout(() => setShowReconnected(false), 3000);
            }
            setIsOffline(!detail.isOnline);
        },
        [isOffline]
    );

    if (showReconnected) {
        return (
            <div
                className="
          fixed top-0 left-0 right-0 z-toast
          flex items-center justify-center
          py-2 px-4
          bg-green-500/90 backdrop-blur-sm
          text-white text-sm font-medium
          animate-slide-down
          safe-area-top
        "
            >
                <span className="mr-2">🟢</span>
                Back online — syncing your data
            </div>
        );
    }

    if (!isMounted) return null;
    if (!isOffline) return null;

    return (
        <div
            className="
        fixed top-0 left-0 right-0 z-toast
        flex items-center justify-center
        py-2 px-4
        bg-amber-500/90 backdrop-blur-sm
        text-white text-sm font-medium
        animate-slide-down
        safe-area-top
      "
        >
            <span className="mr-2">📡</span>
            You're offline — changes will sync when reconnected
        </div>
    );
}
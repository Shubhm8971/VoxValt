'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribe = useCallback(async () => {
        if (!isSupported) return false;
        setSubscribing(true);

        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                throw new Error('Permission denied');
            }

            if (!PUBLIC_VAPID_KEY) {
                console.error('VAPID public key not found');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // Send subscription to backend
            const res = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription),
            });

            if (!res.ok) throw new Error('Failed to save subscription');

            setIsSubscribed(true);
            return true;
        } catch (error) {
            console.error('Failed to subscribe to push notifications', error);
            return false;
        } finally {
            setSubscribing(false);
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return;
        setSubscribing(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from backend
                // We can just rely on the subscription endpoint being unique, 
                // or send the entire subscription object to match and delete.
                // For simplicity, we'll try to delete by endpoint if possible, 
                // but typically unsubs just fail on next send.
                // Let's explicitly delete.
                await fetch('/api/notifications/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }

            setIsSubscribed(false);
        } catch (error) {
            console.error('Failed to unsubscribe', error);
        } finally {
            setSubscribing(false);
        }
    }, [isSupported]);

    const showTypedNotification = (type: string, data: any) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_TYPED_NOTIFICATION',
                payload: { type, ...data }
            });
        }
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        subscribing,
        subscribe,
        unsubscribe,
        showTypedNotification
    };
}

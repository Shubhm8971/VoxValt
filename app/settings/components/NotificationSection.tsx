// app/settings/components/NotificationSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/use-push-notifications';
import type { ProfileData } from '../SettingsPageClient';

interface NotificationSectionProps {
    profile: ProfileData;
    onSave: (updates: Partial<ProfileData>) => Promise<void>;
    saving: boolean;
    deviceCount: number;
}

const BRIEFING_TIMES = [
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
];

export default function NotificationSection({
    profile,
    onSave,
    saving,
    deviceCount,
}: NotificationSectionProps) {
    const {
        isSupported,
        isSubscribed,
        permission,
        subscribing,
        subscribe,
        unsubscribe,
        showTypedNotification,
    } = usePushNotifications();

    const [notificationsEnabled, setNotificationsEnabled] = useState(
        profile.notification_enabled
    );
    const [briefingTime, setBriefingTime] = useState(profile.briefing_time);
    const [briefingTimeChanged, setBriefingTimeChanged] = useState(false);

    const handleToggleNotifications = async () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);

        if (newValue && !isSubscribed) {
            const success = await subscribe();
            if (!success) {
                setNotificationsEnabled(false);
                return;
            }
        }

        if (!newValue && isSubscribed) {
            await unsubscribe();
        }

        await onSave({ notification_enabled: newValue });
    };

    const handleBriefingTimeChange = (time: string) => {
        setBriefingTime(time);
        setBriefingTimeChanged(true);
    };

    const saveBriefingTime = async () => {
        await onSave({ briefing_time: briefingTime });
        setBriefingTimeChanged(false);
    };

    const sendTestNotification = () => {
        showTypedNotification('task', {
            title: '🧪 Test Notification',
            body: 'VoxValt notifications are working! 🎉',
            tag: 'test-notification',
        });
    };

    return (
        <section className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-4">
                🔔 Notifications
            </h3>

            <div className="space-y-4">
                {/* Push Notifications Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-vox-text">
                            Push Notifications
                        </p>
                        <p className="text-xs text-vox-text-muted mt-0.5">
                            {!isSupported
                                ? 'Not supported in this browser'
                                : permission === 'denied'
                                    ? 'Blocked — enable in browser settings'
                                    : isSubscribed
                                        ? `Active on ${deviceCount} device${deviceCount !== 1 ? 's' : ''}`
                                        : 'Get reminders for tasks & promises'}
                        </p>
                    </div>

                    <button
                        onClick={handleToggleNotifications}
                        disabled={!isSupported || permission === 'denied' || subscribing}
                        className={`
              relative w-12 h-7 rounded-full
              transition-all duration-300 ease-in-out
              disabled:opacity-40 disabled:cursor-not-allowed
              ${notificationsEnabled && isSubscribed
                                ? 'bg-brand-500'
                                : 'bg-vox-surface-hover'
                            }
            `}
                        role="switch"
                        aria-checked={notificationsEnabled && isSubscribed}
                    >
                        <div
                            className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md
                transition-transform duration-300 ease-in-out
                flex items-center justify-center
                ${notificationsEnabled && isSubscribed
                                    ? 'translate-x-5.5'
                                    : 'translate-x-0.5'
                                }
              `}
                        >
                            {subscribing && (
                                <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    </button>
                </div>

                {/* Permission denied warning */}
                {isSupported && permission === 'denied' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-400">
                            ⚠️ Notifications are blocked. To enable them:
                        </p>
                        <ol className="text-xs text-amber-400/70 mt-1 ml-4 list-decimal space-y-0.5">
                            <li>Click the lock icon in your browser's address bar</li>
                            <li>Find "Notifications" and set to "Allow"</li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                )}

                {/* Notification Types (when enabled) */}
                {notificationsEnabled && isSubscribed && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="divider" />

                        {/* Notification type toggles */}
                        {[
                            {
                                icon: '🤝',
                                title: 'Promise Reminders',
                                desc: 'Remind you about commitments to others',
                                always: true,
                            },
                            {
                                icon: '📋',
                                title: 'Task Reminders',
                                desc: 'Notify when tasks are due or overdue',
                                always: true,
                            },
                            {
                                icon: '☀️',
                                title: 'Morning Briefing',
                                desc: 'Daily summary of your agenda',
                                always: true,
                            },
                            {
                                icon: '🚨',
                                title: 'Overdue Alerts',
                                desc: 'Alert for items past their due date',
                                always: true,
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="flex items-center justify-between py-1"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-base">{item.icon}</span>
                                    <div>
                                        <p className="text-sm text-vox-text">{item.title}</p>
                                        <p className="text-2xs text-vox-text-muted">{item.desc}</p>
                                    </div>
                                </div>
                                <div className="w-10 h-6 rounded-full bg-brand-500 flex items-center justify-end px-0.5">
                                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                </div>
                            </div>
                        ))}

                        <div className="divider" />

                        {/* Morning Briefing Time */}
                        <div>
                            <label className="block text-xs font-medium text-vox-text-secondary mb-1.5">
                                ☀️ Morning Briefing Time
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={briefingTime}
                                    onChange={(e) => handleBriefingTimeChange(e.target.value)}
                                    className="vox-input flex-1 appearance-none cursor-pointer"
                                >
                                    {BRIEFING_TIMES.map((time) => (
                                        <option key={time.value} value={time.value}>
                                            {time.label}
                                        </option>
                                    ))}
                                </select>

                                {briefingTimeChanged && (
                                    <button
                                        onClick={saveBriefingTime}
                                        disabled={saving}
                                        className="btn-primary px-4 py-2 text-sm"
                                    >
                                        Save
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Test Notification */}
                        <button
                            onClick={sendTestNotification}
                            className="
                w-full py-2.5 rounded-xl text-center text-sm
                bg-vox-surface text-vox-text-secondary font-medium
                hover:bg-vox-surface-hover active:scale-[0.98]
                transition-all duration-200
              "
                        >
                            🧪 Send Test Notification
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
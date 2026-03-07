'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProfileSection from './components/ProfileSection';
import NotificationSection from './components/NotificationSection';
import SubscriptionSection from './components/SubscriptionSection';
import DataSection from './components/DataSection';
import StatsSection from './components/StatsSection';
import DangerZone from './components/DangerZone';
import SettingsHeader from './components/SettingsHeader';
import Toast from './components/Toast';
import { CalendarSettings } from '@/app/components/CalendarSettings';

// ============================================
// Types
// ============================================
export interface UserInfo {
    id: string;
    email: string;
    phone: string;
    avatar: string | null;
    provider: string;
    createdAt: string;
}

export interface ProfileData {
    display_name: string;
    timezone: string;
    language: string;
    notification_enabled: boolean;
    briefing_time: string;
    onboarding_completed: boolean;
}

export interface SubscriptionData {
    plan: string;
    status: string;
    expires_at: string | null;
    payment_id?: string;
    cancelled_at?: string | null;
}

export interface StatsData {
    totalMemories: number;
    activeItems: number;
    completedItems: number;
    daysSinceSignup: number;
    typeCounts: Record<string, number>;
    deviceCount: number;
}

export interface ToastMessage {
    type: 'success' | 'error' | 'info';
    message: string;
}

// ============================================
// Main Settings Page
// ============================================
interface SettingsPageClientProps {
    user: UserInfo;
    profile: ProfileData;
    subscription: SubscriptionData;
    stats: StatsData;
}

export default function SettingsPageClient({
    user,
    profile: initialProfile,
    subscription,
    stats,
}: SettingsPageClientProps) {
    const router = useRouter();
    const { signOut } = useAuth();

    const [profile, setProfile] = useState<ProfileData>(initialProfile);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [saving, setSaving] = useState(false);

    // ============================================
    // Save profile
    // ============================================
    const saveProfile = useCallback(
        async (updates: Partial<ProfileData>) => {
            setSaving(true);
            try {
                const res = await fetch('/api/settings/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to save');
                }

                setProfile((prev) => ({ ...prev, ...updates }));
                showToast('success', 'Settings saved');
            } catch (err: any) {
                showToast('error', err.message || 'Failed to save settings');
            } finally {
                setSaving(false);
            }
        },
        []
    );

    // ============================================
    // Toast helper
    // ============================================
    const showToast = useCallback((type: ToastMessage['type'], message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // ============================================
    // Sign out
    // ============================================
    const handleSignOut = useCallback(async () => {
        try {
            await signOut();
            router.push('/auth');
        } catch (err) {
            showToast('error', 'Failed to sign out');
        }
    }, [signOut, router, showToast]);

    return (
        <main className="min-h-screen-dvh bg-vox-bg bg-mesh-gradient">
            {/* Header */}
            <SettingsHeader onBack={() => router.push('/')} />

            {/* Content */}
            <div className="px-4 sm:px-6 pb-12 max-w-2xl mx-auto">
                <div className="space-y-6">
                    {/* Calendar Integration */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3 text-vox-text">Integrations</h2>
                        <CalendarSettings />
                    </section>

                    {/* Profile */}
                    <ProfileSection
                        user={user}
                        profile={profile}
                        onSave={saveProfile}
                        saving={saving}
                    />

                    {/* Stats */}
                    <StatsSection stats={stats} />

                    {/* Subscription */}
                    <SubscriptionSection
                        subscription={subscription}
                        onShowToast={showToast}
                    />

                    {/* Notifications */}
                    <NotificationSection
                        profile={profile}
                        onSave={saveProfile}
                        saving={saving}
                        deviceCount={stats.deviceCount}
                    />

                    {/* Appearance */}
                    

                    {/* Data Management */}
                    <DataSection
                        stats={stats}
                        onShowToast={showToast}
                    />

                    {/* Sign Out */}
                    <div className="glass-card p-4">
                        <button
                            onClick={handleSignOut}
                            className="
                w-full py-3 rounded-xl text-center
                font-medium text-vox-text-secondary
                hover:bg-vox-surface hover:text-vox-text
                active:scale-[0.98]
                transition-all duration-200
              "
                        >
                            Sign Out
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <DangerZone
                        onShowToast={showToast}
                        onSignOut={handleSignOut}
                    />

                    {/* App Info */}
                    <div className="text-center py-6 space-y-1">
                        <p className="text-xs text-vox-text-muted">
                            VoxValt v1.0.0
                        </p>
                        <p className="text-xs text-vox-text-muted">
                            Made with 🎙️ in India
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <a href="/terms" className="text-xs text-brand-500 hover:underline">
                                Terms
                            </a>
                            <a href="/privacy" className="text-xs text-brand-500 hover:underline">
                                Privacy
                            </a>
                            <a href="mailto:support@voxvalt.com" className="text-xs text-brand-500 hover:underline">
                                Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onDismiss={() => setToast(null)}
                />
            )}
        </main>
    );
}

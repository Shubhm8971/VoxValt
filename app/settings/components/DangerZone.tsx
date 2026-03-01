// app/settings/components/DangerZone.tsx
'use client';

import { useState } from 'react';
import type { ToastMessage } from '../SettingsPageClient';

interface DangerZoneProps {
    onShowToast: (type: ToastMessage['type'], message: string) => void;
    onSignOut: () => void;
}

export default function DangerZone({ onShowToast, onSignOut }: DangerZoneProps) {
    const [showDanger, setShowDanger] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDeleteAll = async () => {
        if (confirmText !== 'DELETE ALL') return;

        setDeleting(true);
        try {
            const res = await fetch('/api/settings/delete-all-data', {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete data');

            onShowToast('success', 'All data deleted. Signing you out...');

            // Clear everything locally
            navigator.serviceWorker?.controller?.postMessage({
                type: 'CLEAR_CACHE',
            });
            localStorage.clear();
            sessionStorage.clear();

            setTimeout(() => onSignOut(), 2000);
        } catch (err: any) {
            onShowToast('error', err.message || 'Failed to delete data');
            setDeleting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirmText !== 'DELETE ACCOUNT') return;

        setDeleting(true);
        try {
            const res = await fetch('/api/settings/delete-account', {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete account');

            onShowToast('success', 'Account deleted. Goodbye! 👋');

            localStorage.clear();
            sessionStorage.clear();

            setTimeout(() => {
                window.location.href = '/auth';
            }, 2000);
        } catch (err: any) {
            onShowToast('error', err.message || 'Failed to delete account');
            setDeleting(false);
        }
    };

    return (
        <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {!showDanger ? (
                <button
                    onClick={() => setShowDanger(true)}
                    className="
            w-full py-3 rounded-xl text-center
            text-sm text-vox-text-muted
            hover:text-red-400 hover:bg-red-500/5
            transition-all duration-200
          "
                >
                    ⚠️ Danger Zone
                </button>
            ) : (
                <div className="rounded-2xl border border-red-500/20 overflow-hidden animate-fade-in">
                    <div className="p-4 bg-red-500/5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                                ⚠️ Danger Zone
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDanger(false);
                                    setConfirmText('');
                                }}
                                className="text-xs text-vox-text-muted hover:text-vox-text-secondary"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Delete All Data */}
                            <div className="p-3 rounded-xl bg-vox-bg/50 border border-red-500/10">
                                <p className="text-sm font-medium text-vox-text mb-1">
                                    Delete All Memories
                                </p>
                                <p className="text-xs text-vox-text-muted mb-3">
                                    Permanently delete all your memories, tasks, and promises.
                                    Your account will remain active.
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                        placeholder='Type "DELETE ALL" to confirm'
                                        className="vox-input flex-1 text-xs border-red-500/20 focus:border-red-500"
                                    />
                                    <button
                                        onClick={handleDeleteAll}
                                        disabled={confirmText !== 'DELETE ALL' || deleting}
                                        className="
                      btn-danger px-4 py-2 text-xs
                      disabled:opacity-30 disabled:cursor-not-allowed
                    "
                                    >
                                        {deleting ? '...' : 'Delete'}
                                    </button>
                                </div>
                            </div>

                            {/* Delete Account */}
                            <div className="p-3 rounded-xl bg-vox-bg/50 border border-red-500/10">
                                <p className="text-sm font-medium text-vox-text mb-1">
                                    Delete Account
                                </p>
                                <p className="text-xs text-vox-text-muted mb-3">
                                    Permanently delete your account, all data, and subscription.
                                    This action is irreversible.
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                        placeholder='Type "DELETE ACCOUNT" to confirm'
                                        className="vox-input flex-1 text-xs border-red-500/20 focus:border-red-500"
                                    />
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={confirmText !== 'DELETE ACCOUNT' || deleting}
                                        className="
                      btn-danger px-4 py-2 text-xs
                      disabled:opacity-30 disabled:cursor-not-allowed
                    "
                                    >
                                        {deleting ? '...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
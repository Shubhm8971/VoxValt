// app/settings/components/Toast.tsx
'use client';

import { useEffect } from 'react';
import type { ToastMessage } from '../SettingsPageClient';

interface ToastProps extends ToastMessage {
    onDismiss: () => void;
}

export default function Toast({ type, message, onDismiss }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const config = {
        success: {
            icon: '✅',
            bg: 'bg-green-500/15 border-green-500/30',
            text: 'text-green-400',
        },
        error: {
            icon: '❌',
            bg: 'bg-red-500/15 border-red-500/30',
            text: 'text-red-400',
        },
        info: {
            icon: 'ℹ️',
            bg: 'bg-brand-500/15 border-brand-500/30',
            text: 'text-brand-400',
        },
    };

    const c = config[type];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-toast flex justify-center pointer-events-none sm:left-auto sm:right-6">
            <div
                className={`
          ${c.bg} border backdrop-blur-xl
          px-4 py-3 rounded-2xl shadow-elevated
          flex items-center gap-2.5
          pointer-events-auto
          animate-slide-up
          max-w-sm w-full
        `}
                role="alert"
            >
                <span className="text-base flex-shrink-0">{c.icon}</span>
                <p className={`${c.text} text-sm font-medium flex-1`}>{message}</p>
                <button
                    onClick={onDismiss}
                    className="text-vox-text-muted hover:text-vox-text-secondary p-1 flex-shrink-0"
                    aria-label="Dismiss"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
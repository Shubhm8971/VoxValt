// app/components/recorder/RecordingError.tsx
'use client';

interface RecordingErrorProps {
    error: string;
    onRetry: () => void;
    onClose?: () => void;
    compact: boolean;
}

export default function RecordingError({ error, onRetry, onClose, compact }: RecordingErrorProps) {
    const isMicPermission = error.toLowerCase().includes('microphone') || error.toLowerCase().includes('permission');
    const isLimitReached = error.toLowerCase().includes('limit') || error.toLowerCase().includes('upgrade');

    return (
        <div className={`w-full animate-fade-in-up ${compact ? '' : ''}`}>
            <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 mb-3">
                    <span className="text-3xl">{isMicPermission ? '🎙️' : isLimitReached ? '⚡' : '❌'}</span>
                </div>
                <h3 className="text-lg font-bold text-vox-text">
                    {isMicPermission ? 'Microphone Access Needed' : isLimitReached ? 'Daily Limit Reached' : 'Recording Failed'}
                </h3>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                <p className="text-sm text-red-400 leading-relaxed">{error}</p>
            </div>

            {isMicPermission && (
                <div className="glass-card p-4 mb-6">
                    <p className="text-xs font-semibold text-vox-text-secondary mb-2">How to fix:</p>
                    <ol className="space-y-1.5">
                        {['Click the lock/info icon in your browser\'s address bar', 'Find "Microphone" permission', 'Change it to "Allow"', 'Refresh the page and try again'].map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-vox-text-muted">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-vox-surface flex items-center justify-center text-2xs font-bold text-vox-text-secondary">{i + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {isLimitReached && (
                <a href="/settings#upgrade" className="block w-full py-3 rounded-xl text-center bg-brand-gradient text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-glow mb-3">
                    ⚡ Upgrade to Pro — Unlimited Recordings
                </a>
            )}

            <div className="flex gap-2">
                {!isLimitReached && <button onClick={onRetry} className="btn-primary flex-1 py-3 text-sm">Try Again</button>}
                {onClose && <button onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">{isLimitReached ? 'Maybe Later' : 'Cancel'}</button>}
            </div>
        </div>
    );
}
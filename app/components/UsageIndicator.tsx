'use client';

import { Mic, Zap } from 'lucide-react';

interface UsageIndicatorProps {
    used: number;
    total: number;
    isPremium: boolean;
    onUpgrade: () => void;
}

export function UsageIndicator({ used, total, isPremium, onUpgrade }: UsageIndicatorProps) {
    if (isPremium) {
        return (
            <div className="bg-vox-surface border border-vox-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-600/20 rounded-lg text-brand-500">
                        <Mic size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-vox-text-secondary uppercase tracking-widest">Plan Usage</p>
                        <p className="text-sm font-bold text-vox-text">Unlimited Recordings</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-600/20 text-brand-500 rounded-full text-xs font-bold">
                    <Zap size={14} className="fill-current" />
                    PREMIUM
                </div>
            </div>
        );
    }

    const percentage = Math.min((used / total) * 100, 100);
    const isNearLimit = used >= total - 1;

    return (
        <div className="bg-vox-surface border border-vox-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isNearLimit ? 'bg-amber-500/20 text-amber-500' : 'bg-brand-600/20 text-brand-500'}`}>
                        <Mic size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-vox-text-secondary uppercase tracking-widest">Monthly Recordings</p>
                        <p className="text-sm font-bold text-vox-text">{used} / {total} used</p>
                    </div>
                </div>
                <button
                    onClick={onUpgrade}
                    className="text-xs font-bold text-brand-500 hover:text-brand-400 underline underline-offset-4"
                >
                    Upgrade
                </button>
            </div>

            <div className="h-2 w-full bg-vox-border rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ${isNearLimit ? 'bg-amber-500' : 'bg-brand-600'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {isNearLimit && (
                <p className="text-[10px] text-amber-500 font-medium mt-2">
                    {used >= total ? 'Limit reached!' : 'Almost out of recordings!'}
                </p>
            )}
        </div>
    );
}

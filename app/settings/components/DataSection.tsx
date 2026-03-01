// app/settings/components/DataSection.tsx
'use client';

import { useState } from 'react';
import type { StatsData, ToastMessage } from '../SettingsPageClient';

interface DataSectionProps {
    stats: StatsData;
    onShowToast: (type: ToastMessage['type'], message: string) => void;
}

export default function DataSection({ stats, onShowToast }: DataSectionProps) {
    const [exporting, setExporting] = useState(false);
    const [clearing, setClearing] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/settings/export');
            if (!res.ok) throw new Error('Export failed');

            const data = await res.json();

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `voxvalt-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onShowToast('success', `Exported ${data.memories?.length || 0} memories`);
        } catch (err: any) {
            onShowToast('error', err.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    const handleClearCompleted = async () => {
        if (!window.confirm('Delete all completed items? This cannot be undone.')) {
            return;
        }

        setClearing(true);
        try {
            const res = await fetch('/api/settings/clear-completed', {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to clear');

            const data = await res.json();
            onShowToast('success', `Cleared ${data.deleted} completed items`);
        } catch (err: any) {
            onShowToast('error', err.message || 'Failed to clear');
        } finally {
            setClearing(false);
        }
    };

    const handleClearCache = () => {
        try {
            // Clear SW caches
            navigator.serviceWorker?.controller?.postMessage({
                type: 'CLEAR_CACHE',
            });

            // Clear localStorage except auth
            const authKeys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sb-')) {
                    authKeys.push(key);
                }
            }

            const authData: Record<string, string> = {};
            authKeys.forEach((key) => {
                authData[key] = localStorage.getItem(key) || '';
            });

            localStorage.clear();

            // Restore auth data
            Object.entries(authData).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            onShowToast('success', 'Cache cleared');
        } catch (err) {
            onShowToast('error', 'Failed to clear cache');
        }
    };

    return (
        <section className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-4">
                💾 Data Management
            </h3>

            <div className="space-y-3">
                {/* Storage info */}
                <div className="flex items-center justify-between p-3 bg-vox-surface/50 rounded-xl">
                    <div className="flex items-center gap-2.5">
                        <span className="text-base">🧠</span>
                        <div>
                            <p className="text-sm text-vox-text">Memory Storage</p>
                            <p className="text-2xs text-vox-text-muted">
                                {stats.totalMemories} memories stored
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-vox-text-secondary font-medium">
                        {estimateStorageSize(stats.totalMemories)}
                    </span>
                </div>

                {/* Export */}
                <button
                    onClick={handleExport}
                    disabled={exporting || stats.totalMemories === 0}
                    className="
            w-full flex items-center justify-between p-3
            rounded-xl bg-vox-surface/30
            hover:bg-vox-surface/50 active:scale-[0.99]
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
                >
                    <div className="flex items-center gap-2.5">
                        <span className="text-base">📥</span>
                        <div className="text-left">
                            <p className="text-sm text-vox-text">Export All Data</p>
                            <p className="text-2xs text-vox-text-muted">
                                Download as JSON file
                            </p>
                        </div>
                    </div>
                    {exporting ? (
                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-4 h-4 text-vox-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                </button>

                {/* Clear completed */}
                <button
                    onClick={handleClearCompleted}
                    disabled={clearing || stats.completedItems === 0}
                    className="
            w-full flex items-center justify-between p-3
            rounded-xl bg-vox-surface/30
            hover:bg-vox-surface/50 active:scale-[0.99]
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
                >
                    <div className="flex items-center gap-2.5">
                        <span className="text-base">🧹</span>
                        <div className="text-left">
                            <p className="text-sm text-vox-text">Clear Completed Items</p>
                            <p className="text-2xs text-vox-text-muted">
                                Remove {stats.completedItems} completed items
                            </p>
                        </div>
                    </div>
                    {clearing ? (
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-4 h-4 text-vox-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                </button>

                {/* Clear cache */}
                <button
                    onClick={handleClearCache}
                    className="
            w-full flex items-center justify-between p-3
            rounded-xl bg-vox-surface/30
            hover:bg-vox-surface/50 active:scale-[0.99]
            transition-all duration-200
          "
                >
                    <div className="flex items-center gap-2.5">
                        <span className="text-base">🗑️</span>
                        <div className="text-left">
                            <p className="text-sm text-vox-text">Clear App Cache</p>
                            <p className="text-2xs text-vox-text-muted">
                                Free up space, keep your data
                            </p>
                        </div>
                    </div>
                    <svg className="w-4 h-4 text-vox-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </section>
    );
}

function estimateStorageSize(count: number): string {
    // Rough estimate: ~2KB per memory (content + embedding)
    const bytes = count * 2048;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
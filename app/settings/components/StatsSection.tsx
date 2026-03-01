// app/settings/components/StatsSection.tsx
'use client';

import type { StatsData } from '../SettingsPageClient';

interface StatsSectionProps {
    stats: StatsData;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    task: { icon: '📋', label: 'Tasks', color: 'text-memory-task' },
    promise: { icon: '🤝', label: 'Promises', color: 'text-memory-promise' },
    reminder: { icon: '⏰', label: 'Reminders', color: 'text-memory-reminder' },
    idea: { icon: '💡', label: 'Ideas', color: 'text-memory-idea' },
    memo: { icon: '📝', label: 'Memos', color: 'text-memory-memo' },
    voice_note: { icon: '🎙️', label: 'Voice Notes', color: 'text-vox-text-secondary' },
};

export default function StatsSection({ stats }: StatsSectionProps) {
    const completionRate =
        stats.completedItems + stats.activeItems > 0
            ? Math.round(
                (stats.completedItems / (stats.completedItems + stats.activeItems)) * 100
            )
            : 0;

    return (
        <section className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-4">
                📊 Your Memory Stats
            </h3>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                    {
                        label: 'Total Memories',
                        value: stats.totalMemories,
                        icon: '🧠',
                        color: 'text-brand-400',
                    },
                    {
                        label: 'Active Items',
                        value: stats.activeItems,
                        icon: '📌',
                        color: 'text-amber-400',
                    },
                    {
                        label: 'Completed',
                        value: stats.completedItems,
                        icon: '✅',
                        color: 'text-green-400',
                    },
                    {
                        label: 'Days Active',
                        value: stats.daysSinceSignup,
                        icon: '📅',
                        color: 'text-purple-400',
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-vox-surface/50 rounded-xl p-3 text-center"
                    >
                        <span className="text-lg">{stat.icon}</span>
                        <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                            {stat.value.toLocaleString()}
                        </p>
                        <p className="text-2xs text-vox-text-muted mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Completion Rate */}
            {stats.completedItems + stats.activeItems > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-vox-text-secondary">
                            Completion Rate
                        </span>
                        <span className="text-xs font-bold text-vox-text">
                            {completionRate}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-vox-surface rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${completionRate >= 70
                                    ? 'bg-green-500'
                                    : completionRate >= 40
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                }`}
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Type Breakdown */}
            {Object.keys(stats.typeCounts).length > 0 && (
                <div>
                    <span className="text-2xs text-vox-text-muted uppercase tracking-wider block mb-2">
                        By Type
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.typeCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => {
                                const config = TYPE_CONFIG[type] || {
                                    icon: '📄',
                                    label: type,
                                    color: 'text-vox-text-secondary',
                                };
                                return (
                                    <div
                                        key={type}
                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-vox-surface/50 rounded-lg"
                                    >
                                        <span className="text-sm">{config.icon}</span>
                                        <span className={`text-xs font-medium ${config.color}`}>
                                            {count}
                                        </span>
                                        <span className="text-2xs text-vox-text-muted">
                                            {config.label}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </section>
    );
}
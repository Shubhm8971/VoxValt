// app/components/FamilyAnalytics.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    BarChart3,
    Award,
    CheckCircle2,
    Loader,
    Users,
    Activity
} from 'lucide-react';

interface AnalyticsData {
    totalMemories: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    dailyTrend: { date: string; count: number }[];
    topContributorName: string;
    topContributorCount: number;
}

export function FamilyAnalytics({ teamId }: { teamId: string }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/analytics/team/${teamId}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.analytics);
                }
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        if (teamId) {
            fetchAnalytics();
        }
    }, [teamId]);

    if (loading) return (
        <div className="flex items-center justify-center p-12 bg-vox-surface rounded-2xl border border-vox-border/50">
            <Loader className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
    );

    if (!data) return null;

    const maxCount = Math.max(...data.dailyTrend.map(t => t.count), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-vox-text flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                    Team Productivity
                </h3>
                <div className="bg-brand-500/10 text-brand-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-brand-500/20">
                    Pro Insights
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 border border-vox-border/30">
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Total Memories</p>
                    <p className="text-2xl font-black text-vox-text">{data.totalMemories}</p>
                </div>
                <div className="glass-card p-4 border border-vox-border/30">
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Completion</p>
                    <p className="text-2xl font-black text-vox-text">{Math.round(data.completionRate)}%</p>
                </div>
                <div className="glass-card p-4 border border-vox-border/30">
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Total Tasks</p>
                    <p className="text-2xl font-black text-vox-text">{data.totalTasks}</p>
                </div>
                <div className="glass-card p-4 border border-vox-border/30">
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Done</p>
                    <p className="text-2xl font-black text-brand-400">{data.completedTasks}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Trend Chart */}
                <div className="glass-card p-5 border border-vox-border/30 space-y-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-vox-text-secondary" />
                        <h4 className="text-xs font-bold text-vox-text uppercase tracking-widest">7-Day Activity Trend</h4>
                    </div>

                    <div className="flex items-end justify-between h-32 gap-2 pt-2">
                        {data.dailyTrend.map((t, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-brand-gradient rounded-t-lg transition-all duration-500 group-hover:brightness-125 group-hover:shadow-glow shadow-brand-500/20"
                                    style={{ height: `${(t.count / maxCount) * 100}%`, minHeight: '4px' }}
                                />
                                <span className="text-[8px] font-bold text-vox-text-muted uppercase">
                                    {new Date(t.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Contributor */}
                <div className="glass-card p-5 border border-vox-border/30 space-y-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-brand-400" />
                        <h4 className="text-xs font-bold text-vox-text uppercase tracking-widest">Star Contributor</h4>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-black text-xl shadow-glow shadow-brand-500/30">
                            {data.topContributorName[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-lg font-black text-vox-text">{data.topContributorName}</p>
                            <p className="text-xs text-vox-text-secondary">{data.topContributorCount} contributions this week</p>
                        </div>
                    </div>

                    <div className="bg-vox-bg/50 rounded-xl p-3 border border-vox-border/30">
                        <p className="text-[10px] text-vox-text-muted italic leading-relaxed">
                            "High engagement drives family reliability. Keep capturing shared moments!"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
    reliabilityScore: number;
    totalPromises: number;
    completedPromises: number;
}

export function FamilyAnalytics({ teamId }: { teamId: string }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [pulse, setPulse] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const [analyticsRes, pulseRes] = await Promise.all([
                    fetch(`/api/analytics/team/${teamId}`),
                    fetch(`/api/analytics/pulse?teamId=${teamId}`)
                ]);

                const analyticsJson = await analyticsRes.json();
                const pulseJson = await pulseRes.json();

                if (analyticsJson.success) {
                    setData(analyticsJson.analytics);
                }
                if (pulseJson.success) {
                    setPulse(pulseJson.pulse);
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
                    Team Intelligence
                </h3>
                <div className="bg-brand-500/10 text-brand-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-brand-500/20">
                    Pro Insights
                </div>
            </div>

            {/* AI Pulse Report */}
            {pulse && (
                <div className="bg-brand- gradient p-[1px] rounded-3xl group shadow-glow shadow-brand-500/10">
                    <div className="bg-slate-950 p-6 rounded-[23px] space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-400" />
                            <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Team Pulse AI</h4>
                        </div>
                        <p className="text-vox-text leading-relaxed text-sm">
                            {pulse}
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 border border-vox-border/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={40} />
                    </div>
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Reliability Score</p>
                    <p className={`text-2xl font-black ${data.reliabilityScore > 80 ? 'text-green-400' : 'text-brand-400'}`}>
                        {Math.round(data.reliabilityScore)}%
                    </p>
                    <div className="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                        <div
                            className="bg-brand-gradient h-full rounded-full transition-all duration-1000"
                            style={{ width: `${data.reliabilityScore}%` }}
                        />
                    </div>
                </div>
                <div className="glass-card p-5 border border-vox-border/30">
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Promise Success</p>
                    <p className="text-2xl font-black text-vox-text">{data.completedPromises} / {data.totalPromises}</p>
                </div>
                <div className="glass-card p-5 border border-vox-border/30">
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Total Memories</p>
                    <p className="text-2xl font-black text-vox-text">{data.totalMemories}</p>
                </div>
                <div className="glass-card p-5 border border-vox-border/30">
                    <p className="text-vox-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Completion Rate</p>
                    <p className="text-2xl font-black text-vox-text">{Math.round(data.completionRate)}%</p>
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

// Helper icons
function Sparkles({ className, size = 16 }: { className?: string; size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    );
}

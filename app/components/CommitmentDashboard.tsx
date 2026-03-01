'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { format, isAfter, isBefore, addDays, startOfToday } from 'date-fns';
import { Handshake, Clock, AlertCircle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface CommitmentDashboardProps {
    tasks: Task[];
    onStatusChange: (task: Task) => void;
    onEdit: (task: Task) => void;
}

export default function CommitmentDashboard({ tasks, onStatusChange, onEdit }: CommitmentDashboardProps) {
    const promises = tasks.filter(t => t.task_type === 'promise' || t.task_type === 'recurring');

    const today = startOfToday();
    const nextWeek = addDays(today, 7);

    const urgent = promises.filter(p => !p.completed && p.due_date && isBefore(new Date(p.due_date), addDays(today, 1)));
    const upcoming = promises.filter(p => !p.completed && p.due_date && isAfter(new Date(p.due_date), today) && isBefore(new Date(p.due_date), nextWeek));
    const completed = promises.filter(p => p.completed).slice(0, 5);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-vox-text flex items-center gap-2">
                        <Handshake className="text-amber-500" />
                        Commitment Tracker
                    </h2>
                    <p className="text-sm text-vox-text-secondary">Tracking promises made to yourself and others.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    <Zap size={14} className="text-amber-500" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-tighter">Proactive Mode</span>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <CommitmentStatCard
                    label="Active Promises"
                    value={promises.filter(p => !p.completed).length}
                    icon={<Clock size={16} />}
                    color="text-brand-400"
                />
                <CommitmentStatCard
                    label="Urgent"
                    value={urgent.length}
                    icon={<AlertCircle size={16} />}
                    color="text-red-400"
                />
                <CommitmentStatCard
                    label="Completed"
                    value={promises.filter(p => p.completed).length}
                    icon={<CheckCircle2 size={16} />}
                    color="text-green-400"
                />
                <CommitmentStatCard
                    label="Sync Status"
                    value="Active"
                    icon={<Zap size={16} />}
                    color="text-amber-400"
                />
            </div>

            {/* Urgent Commitments */}
            {urgent.length > 0 && (
                <section>
                    <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 px-1">Urgent Attention Required</h3>
                    <div className="space-y-3">
                        {urgent.map(promise => (
                            <CommitmentItem
                                key={promise.id}
                                promise={promise}
                                onStatusChange={onStatusChange}
                                onEdit={onEdit}
                                variant="urgent"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming Commitments */}
            <section>
                <h3 className="text-xs font-black text-vox-text-muted uppercase tracking-widest mb-3 px-1">Upcoming Commitments</h3>
                {upcoming.length > 0 ? (
                    <div className="space-y-3">
                        {upcoming.map(promise => (
                            <CommitmentItem
                                key={promise.id}
                                promise={promise}
                                onStatusChange={onStatusChange}
                                onEdit={onEdit}
                                variant="default"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 glass-card border-dashed flex flex-col items-center justify-center text-center opacity-60">
                        <Handshake size={32} className="mb-2 text-vox-text-muted" />
                        <p className="text-sm">No upcoming promises detected.</p>
                        <p className="text-xs text-vox-text-muted mt-1">Record a voice note like "I promise to..."</p>
                    </div>
                )}
            </section>

            {/* Recently Completed */}
            {completed.length > 0 && (
                <section className="opacity-70">
                    <h3 className="text-xs font-black text-vox-text-muted uppercase tracking-widest mb-3 px-1">Recently Kept</h3>
                    <div className="space-y-2">
                        {completed.map(promise => (
                            <div key={promise.id} className="flex items-center gap-3 px-4 py-2 bg-vox-surface/30 rounded-xl border border-vox-border/50">
                                <CheckCircle2 size={14} className="text-green-500" />
                                <span className="text-sm text-vox-text-secondary line-clamp-1 flex-1 line-through">{promise.title}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function CommitmentStatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
    return (
        <div className="glass-card p-3 flex flex-col gap-1">
            <div className={`flex items-center gap-2 text-xs font-medium ${color}`}>
                {icon}
                {label}
            </div>
            <div className="text-2xl font-bold text-vox-text">{value}</div>
        </div>
    );
}

function CommitmentItem({ promise, onStatusChange, onEdit, variant }: { promise: Task; onStatusChange: (p: Task) => void; onEdit: (p: Task) => void; variant: 'urgent' | 'default' }) {
    return (
        <div
            onClick={() => onEdit(promise)}
            className={`
                group p-4 rounded-2xl border transition-all cursor-pointer
                ${variant === 'urgent'
                    ? 'bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20 hover:border-red-500/40 shadow-glow-sm'
                    : 'bg-vox-surface/50 border-vox-border hover:bg-vox-surface hover:border-vox-text-muted'}
            `}
        >
            <div className="flex items-start gap-3">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange({ ...promise, completed: true });
                    }}
                    className="mt-1 w-5 h-5 rounded-lg border border-vox-border flex items-center justify-center hover:bg-brand-500/20 transition-all active:scale-90"
                >
                    <div className="w-2.5 h-2.5 rounded-sm bg-transparent group-hover:bg-vox-text-muted" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${variant === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-500'}`}>
                            {promise.task_type === 'recurring' ? 'Recurring' : 'Promise'}
                        </span>
                        {variant === 'urgent' && <span className="text-[10px] font-bold text-red-500 animate-pulse">OVERDUE</span>}
                    </div>
                    <h4 className="text-sm font-semibold text-vox-text group-hover:text-brand-400 transition-colors">{promise.title}</h4>
                    <div className="flex items-center gap-3 mt-2">
                        {promise.due_date && (
                            <span className="text-[10px] text-vox-text-muted flex items-center gap-1">
                                <Clock size={10} />
                                {format(new Date(promise.due_date), 'MMM d, h:mm a')}
                            </span>
                        )}
                        {promise.recurrence && (
                            <span className="text-[10px] text-vox-text-muted flex items-center gap-1">
                                <Zap size={10} />
                                {promise.recurrence}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronRight size={16} className="text-vox-text-muted group-hover:text-vox-text transition-all group-hover:translate-x-1" />
            </div>
        </div>
    );
}

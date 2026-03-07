// app/components/recorder/RecordingResult.tsx
'use client';

import { useState } from 'react';

type ProcessingResult = any;  // Placeholder type
type ExtractedItem = any;     // Placeholder type

interface RecordingResultProps {
    result: ProcessingResult;
    duration: number;
    onRecordAnother: () => void;
    onClose?: () => void;
    compact: boolean;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; badgeClass: string; cardClass: string }> = {
    task: { icon: '📋', label: 'Task', badgeClass: 'badge-task', cardClass: 'memory-card-task' },
    promise: { icon: '🤝', label: 'Promise', badgeClass: 'badge-promise', cardClass: 'memory-card-promise' },
    reminder: { icon: '⏰', label: 'Reminder', badgeClass: 'badge-reminder', cardClass: 'memory-card-reminder' },
    idea: { icon: '💡', label: 'Idea', badgeClass: 'badge-idea', cardClass: 'memory-card-idea' },
    memo: { icon: '📝', label: 'Memo', badgeClass: 'badge-memo', cardClass: 'memory-card-memo' },
    recurring: { icon: '🔄', label: 'Recurring', badgeClass: 'badge-reminder', cardClass: 'memory-card-reminder' },
};

export default function RecordingResult({ result, duration, onRecordAnother, onClose, compact }: RecordingResultProps) {
    const [showTranscription, setShowTranscription] = useState(false);
    const { transcription, extracted, saved_count, errors } = result;

    const formatDuration = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    };

    return (
        <div className={`w-full animate-fade-in-up ${compact ? '' : ''}`}>
            {/* Success Header */}
            <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 mb-3">
                    <span className="text-3xl animate-scale-in">✅</span>
                </div>
                <h3 className="text-lg font-bold text-vox-text">Memory Saved!</h3>
                <p className="text-sm text-vox-text-secondary mt-1">
                    {saved_count} item{saved_count !== 1 ? 's' : ''} extracted from {formatDuration(duration)} recording
                </p>
            </div>

            {/* Summary */}
            {extracted.summary && (
                <div className="glass-card p-3.5 mb-4">
                    <p className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-1.5">Summary</p>
                    <p className="text-sm text-vox-text leading-relaxed">{extracted.summary}</p>
                </div>
            )}

            {/* Items */}
            {extracted.items.length > 0 && (
                <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider">Extracted Items</p>
                    {extracted.items.map((item: any, i: number) => {
                        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.memo;
                        return (
                            <div key={i} className={`vox-card p-3 ${config.cardClass} animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
                                <div className="flex items-start gap-2.5">
                                    <span className="text-base mt-0.5 flex-shrink-0">{config.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className={config.badgeClass}>{config.label}</span>
                                            {item.priority === 'high' && <span className="badge-high-priority">HIGH</span>}
                                        </div>
                                        <p className="text-sm text-vox-text leading-relaxed">{item.content}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            {item.due_date && (
                                                <span className="text-2xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    📅 {new Date(item.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                            {item.people_involved?.map((person: any, j: number) => (
                                                <span key={j} className="text-2xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    👤 {person}
                                                </span>
                                            ))}
                                        </div>
                                        {item.context && <p className="text-2xs text-vox-text-muted mt-1 italic">{item.context}</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tags */}
            {extracted.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {extracted.tags.map((tag: any, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Transcription toggle */}
            <div className="mb-4">
                <button onClick={() => setShowTranscription(!showTranscription)} className="flex items-center gap-2 w-full text-xs text-vox-text-muted hover:text-vox-text-secondary transition-colors">
                    <svg className={`w-3 h-3 transition-transform duration-200 ${showTranscription ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    View full transcription
                </button>
                {showTranscription && (
                    <div className="mt-2 p-3 rounded-xl bg-vox-surface/50 animate-fade-in-down">
                        <p className="text-xs text-vox-text-secondary leading-relaxed italic">"{transcription}"</p>
                    </div>
                )}
            </div>

            {/* Errors */}
            {errors && errors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                    <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Some items couldn't be saved:</p>
                    {errors.map((err: any, i: number) => <p key={i} className="text-2xs text-amber-400/70">• {err}</p>)}
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
                <button onClick={onRecordAnother} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                    </svg>
                    Record Another
                </button>
                {onClose && <button onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">Done</button>}
            </div>
        </div>
    );
}
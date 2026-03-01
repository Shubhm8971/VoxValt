// app/components/recorder/MemoList.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { Memo } from '../VoiceRecorder';

interface MemoListProps {
    memos: Memo[];
    onDelete: (id: string) => void;
}

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
    task: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    reminder: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    promise: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    recurring: { bg: 'bg-green-500/15', text: 'text-green-400' },
};

const TYPE_ICONS: Record<string, string> = {
    task: '📋',
    reminder: '⏰',
    promise: '🤝',
    recurring: '🔄',
};

export default function MemoList({ memos, onDelete }: MemoListProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-vox-text-secondary uppercase tracking-wider">
                    Voice Memos
                    {memos.length > 0 && (
                        <span className="ml-2 text-vox-text-muted font-normal">
                            ({memos.length})
                        </span>
                    )}
                </h2>
            </div>

            <div className="space-y-3">
                {memos.map((memo, index) => (
                    <MemoCard
                        key={memo.id}
                        memo={memo}
                        index={index}
                        onDelete={() => onDelete(memo.id)}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================
// Individual Memo Card
// ============================================
function MemoCard({
    memo,
    index,
    onDelete,
}: {
    memo: Memo;
    index: number;
    onDelete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isLong = memo.transcript.length > 150;
    const displayText =
        expanded || !isLong
            ? memo.transcript
            : memo.transcript.substring(0, 150) + '...';

    const hasTasks = memo.extractedData?.tasks && memo.extractedData.tasks.length > 0;

    return (
        <div
            className="
        vox-card overflow-hidden
        animate-fade-in-up
        group
      "
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Main Content */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                        className="
              flex-shrink-0 w-10 h-10 rounded-xl
              bg-brand-gradient
              flex items-center justify-center
            "
                    >
                        <span className="text-lg">🎙️</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-vox-text leading-relaxed">
                            {displayText}
                        </p>

                        {isLong && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-xs text-brand-500 hover:underline mt-1"
                            >
                                {expanded ? 'Show less' : 'Show more'}
                            </button>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2 text-2xs text-vox-text-muted">
                            <span>
                                {memo.timestamp.toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            <span>•</span>
                            <span>{formatDuration(memo.duration)}</span>
                            {memo.isProcessing && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-brand-400">
                                        <div className="w-2.5 h-2.5 border-[1.5px] border-brand-400 border-t-transparent rounded-full animate-spin" />
                                        Processing
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex-shrink-0">
                        {confirmDelete ? (
                            <div className="flex items-center gap-1 animate-fade-in">
                                <button
                                    onClick={() => {
                                        onDelete();
                                        setConfirmDelete(false);
                                    }}
                                    className="
                    px-2 py-1 rounded-lg text-2xs font-medium
                    bg-red-500/15 text-red-400
                    hover:bg-red-500/25
                    active:scale-95
                    transition-all duration-200
                  "
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="
                    px-2 py-1 rounded-lg text-2xs font-medium
                    bg-vox-surface text-vox-text-muted
                    hover:bg-vox-surface-hover
                    active:scale-95
                    transition-all duration-200
                  "
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="
                  w-8 h-8 rounded-lg
                  flex items-center justify-center
                  text-vox-text-muted
                  hover:text-red-400 hover:bg-red-500/10
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                  active:scale-90
                "
                                aria-label="Delete memo"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Extracted Tasks Section */}
            <div
                className={`
          px-4 py-3 border-t border-vox-border
          ${hasTasks
                        ? 'bg-brand-500/[0.03]'
                        : 'bg-vox-surface/30'
                    }
        `}
            >
                {memo.isProcessing ? (
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-vox-text-muted">
                            Analyzing with AI...
                        </p>
                    </div>
                ) : hasTasks ? (
                    <div>
                        <p className="text-2xs text-vox-text-muted font-medium mb-2">
                            ✨ Extracted Items:
                        </p>
                        <div className="space-y-1.5">
                            {memo.extractedData!.tasks.map((task, idx) => {
                                const style =
                                    TYPE_STYLES[task.type] ||
                                    TYPE_STYLES.task;
                                const icon =
                                    TYPE_ICONS[task.type] || '📋';

                                return (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="text-sm flex-shrink-0 mt-0.5">
                                            {icon}
                                        </span>
                                        <span
                                            className={`
                        text-2xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                        ${style.bg} ${style.text}
                      `}
                                        >
                                            {task.type}
                                        </span>
                                        <span className="text-xs text-vox-text-secondary flex-1">
                                            {task.title}
                                        </span>
                                        {task.due_date && (
                                            <span
                                                className="
                          text-2xs px-2 py-0.5 rounded-full font-medium
                          bg-green-500/15 text-green-400
                          whitespace-nowrap flex-shrink-0
                        "
                                            >
                                                📅{' '}
                                                {format(new Date(task.due_date), 'MMM d')}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {memo.extractedData!.summary && (
                            <p className="text-2xs text-vox-text-muted mt-2 italic">
                                💡 {memo.extractedData!.summary}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-vox-text-muted">
                        No tasks extracted from this recording
                    </p>
                )}
            </div>
        </div>
    );
}
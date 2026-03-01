// app/search/components/RecentMemories.tsx
'use client';

import type { Memory } from '../SearchPageClient';

interface RecentMemoriesProps {
    memories: Memory[];
    onComplete: (id: string) => void;
}

const typeIcons: Record<string, string> = {
    task: '📋',
    promise: '🤝',
    reminder: '⏰',
    idea: '💡',
    memo: '📝',
    voice_note: '🎙️',
};

export default function RecentMemories({ memories, onComplete }: RecentMemoriesProps) {
    if (memories.length === 0) return null;

    return (
        <div>
            <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-3">
                Recent Memories
            </h3>

            <div className="space-y-2">
                {memories.map((memory, i) => {
                    // Clean content
                    const cleanContent = memory.content
                        .replace(/^\[.*?\]\s*/i, '')
                        .replace(/\s*\|\s*(Tags|Context|People|Due):.*$/gi, '')
                        .trim();

                    const truncated =
                        cleanContent.length > 120
                            ? cleanContent.substring(0, 120) + '...'
                            : cleanContent;

                    const timeAgo = getTimeAgo(new Date(memory.created_at));

                    return (
                        <div
                            key={memory.id}
                            className="
                flex items-start gap-3 p-3
                rounded-xl
                hover:bg-vox-surface/50
                transition-all duration-200
                animate-fade-in-up
              "
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            {/* Icon */}
                            <span className="text-base mt-0.5 flex-shrink-0">
                                {typeIcons[memory.type] || '📝'}
                            </span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-vox-text-secondary leading-relaxed">
                                    {truncated}
                                </p>

                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-2xs text-vox-text-muted">{timeAgo}</span>

                                    {memory.status === 'completed' && (
                                        <span className="text-2xs text-green-400">✅ Done</span>
                                    )}

                                    {memory.priority === 'high' && memory.status === 'active' && (
                                        <span className="text-2xs text-red-400">🔴 High</span>
                                    )}
                                </div>
                            </div>

                            {/* Quick complete */}
                            {memory.status === 'active' &&
                                ['task', 'promise', 'reminder'].includes(memory.type) && (
                                    <button
                                        onClick={() => onComplete(memory.id)}
                                        className="
                      w-7 h-7 rounded-lg flex-shrink-0
                      flex items-center justify-center
                      text-vox-text-muted hover:text-green-400
                      hover:bg-green-500/10
                      transition-all duration-200 active:scale-90
                    "
                                        aria-label="Mark as done"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
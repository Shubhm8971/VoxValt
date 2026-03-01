// app/search/components/SearchResults.tsx
'use client';

import { useState } from 'react';
import type { Memory } from '../SearchPageClient';

interface SearchResultsProps {
    results: Memory[];
    query: string;
    onComplete: (id: string) => void;
    onArchive: (id: string) => void;
}

export default function SearchResults({
    results,
    query,
    onComplete,
    onArchive,
}: SearchResultsProps) {
    return (
        <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider">
                    Results
                    <span className="ml-1.5 text-vox-text-muted">
                        ({results.length})
                    </span>
                </h2>
            </div>

            {/* Results List */}
            <div className="space-y-2.5">
                {results.map((memory, index) => (
                    <SearchResultCard
                        key={memory.id}
                        memory={memory}
                        query={query}
                        index={index}
                        onComplete={onComplete}
                        onArchive={onArchive}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================
// Individual Search Result Card
// ============================================
interface SearchResultCardProps {
    memory: Memory;
    query: string;
    index: number;
    onComplete: (id: string) => void;
    onArchive: (id: string) => void;
}

function SearchResultCard({
    memory,
    query,
    index,
    onComplete,
    onArchive,
}: SearchResultCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [completing, setCompleting] = useState(false);

    const typeConfig: Record<string, { icon: string; label: string; cardClass: string; badgeClass: string }> = {
        task: { icon: '📋', label: 'Task', cardClass: 'memory-card-task', badgeClass: 'badge-task' },
        promise: { icon: '🤝', label: 'Promise', cardClass: 'memory-card-promise', badgeClass: 'badge-promise' },
        reminder: { icon: '⏰', label: 'Reminder', cardClass: 'memory-card-reminder', badgeClass: 'badge-reminder' },
        idea: { icon: '💡', label: 'Idea', cardClass: 'memory-card-idea', badgeClass: 'badge-idea' },
        memo: { icon: '📝', label: 'Memo', cardClass: 'memory-card-memo', badgeClass: 'badge-memo' },
        voice_note: { icon: '🎙️', label: 'Voice Note', cardClass: 'memory-card-memo', badgeClass: 'badge-memo' },
    };

    const config = typeConfig[memory.type] || typeConfig.memo;
    const similarity = memory.similarity ? Math.round(memory.similarity * 100) : null;

    // Clean content
    const cleanContent = memory.content
        .replace(/^\[.*?\]\s*/i, '')
        .replace(/\s*\|\s*(Tags|Context|People|Due):.*$/gi, '')
        .trim();

    // Highlight matching words from query
    const highlightContent = (text: string) => {
        if (!query.trim()) return text;

        const words = query
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 2)
            .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

        if (words.length === 0) return text;

        const regex = new RegExp(`(${words.join('|')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark
                    key={i}
                    className="bg-brand-500/20 text-brand-300 px-0.5 rounded"
                >
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    const isShortContent = cleanContent.length < 150;
    const displayContent = expanded || isShortContent
        ? cleanContent
        : cleanContent.substring(0, 150) + '...';

    const handleComplete = async () => {
        setCompleting(true);
        await onComplete(memory.id);
        setCompleting(false);
    };

    const timeAgo = getTimeAgo(new Date(memory.created_at));

    return (
        <div
            className={`
        vox-card p-4 ${config.cardClass}
        transition-all duration-200
        animate-fade-in-up
      `}
            style={{ animationDelay: `${index * 60}ms` }}
            onClick={() => setShowActions(!showActions)}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-lg mt-0.5 select-none-touch flex-shrink-0">
                    {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={config.badgeClass}>{config.label}</span>

                        {memory.priority === 'high' && (
                            <span className="badge-high-priority">HIGH</span>
                        )}

                        {memory.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-green-500/15 text-green-400">
                                COMPLETED
                            </span>
                        )}

                        {/* Similarity score */}
                        {similarity !== null && (
                            <span
                                className={`
                  ml-auto text-2xs font-medium px-2 py-0.5 rounded-full
                  ${similarity >= 85
                                        ? 'bg-green-500/10 text-green-400'
                                        : similarity >= 70
                                            ? 'bg-amber-500/10 text-amber-400'
                                            : 'bg-vox-surface text-vox-text-muted'
                                    }
                `}
                            >
                                {similarity}% match
                            </span>
                        )}
                    </div>

                    {/* Content text with highlighting */}
                    <p className="text-sm text-vox-text leading-relaxed">
                        {highlightContent(displayContent)}
                    </p>

                    {/* Show more/less */}
                    {!isShortContent && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                            className="text-xs text-brand-500 hover:underline mt-1"
                        >
                            {expanded ? 'Show less' : 'Show more'}
                        </button>
                    )}

                    {/* People tags */}
                    {memory.people && memory.people.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {memory.people.map((person, i) => (
                                <span
                                    key={i}
                                    className="text-2xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                >
                                    👤 {person}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {memory.tags && memory.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {memory.tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="text-2xs px-2 py-0.5 rounded-full bg-vox-surface text-vox-text-muted"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer: time + actions */}
                    <div className="flex items-center justify-between mt-2.5">
                        <span className="text-2xs text-vox-text-muted">{timeAgo}</span>

                        {/* Action buttons (shown on click/tap) */}
                        {showActions && memory.status === 'active' && (
                            <div
                                className="flex items-center gap-2 animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {['task', 'promise', 'reminder'].includes(memory.type) && (
                                    <button
                                        onClick={handleComplete}
                                        disabled={completing}
                                        className="
                      flex items-center gap-1 px-2.5 py-1 rounded-lg
                      bg-green-500/10 text-green-400 text-xs font-medium
                      hover:bg-green-500/20 active:scale-95
                      transition-all duration-200
                      disabled:opacity-50
                    "
                                    >
                                        {completing ? (
                                            <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            '✅'
                                        )}
                                        Done
                                    </button>
                                )}

                                <button
                                    onClick={() => onArchive(memory.id)}
                                    className="
                    flex items-center gap-1 px-2.5 py-1 rounded-lg
                    bg-vox-surface text-vox-text-muted text-xs font-medium
                    hover:bg-vox-surface-hover active:scale-95
                    transition-all duration-200
                  "
                                >
                                    📦 Archive
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Similarity bar */}
            {similarity !== null && (
                <div className="mt-3 mx-11">
                    <div className="w-full h-1 rounded-full bg-vox-surface overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${similarity >= 85
                                    ? 'bg-green-500'
                                    : similarity >= 70
                                        ? 'bg-amber-500'
                                        : 'bg-vox-text-muted'
                                }`}
                            style={{ width: `${similarity}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Time ago helper
// ============================================
function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
}
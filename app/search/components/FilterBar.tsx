// app/search/components/FilterBar.tsx
'use client';

import type { SearchFilters } from '../SearchPageClient';

interface FilterBarProps {
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    availableTags: string[];
    availablePeople: string[];
    onApply: () => void;
}

const MEMORY_TYPES = [
    { key: 'task', label: 'Tasks', icon: '📋', color: 'text-memory-task' },
    { key: 'promise', label: 'Promises', icon: '🤝', color: 'text-memory-promise' },
    { key: 'reminder', label: 'Reminders', icon: '⏰', color: 'text-memory-reminder' },
    { key: 'idea', label: 'Ideas', icon: '💡', color: 'text-memory-idea' },
    { key: 'memo', label: 'Memos', icon: '📝', color: 'text-memory-memo' },
    { key: 'voice_note', label: 'Voice Notes', icon: '🎙️', color: 'text-vox-text-secondary' },
];

const STATUS_OPTIONS = [
    { key: 'active', label: 'Active', icon: '🟢' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'archived', label: 'Archived', icon: '📦' },
];

export default function FilterBar({
    filters,
    onFiltersChange,
    availableTags,
    availablePeople,
    onApply,
}: FilterBarProps) {
    const toggleType = (type: string) => {
        const updated = filters.types.includes(type)
            ? filters.types.filter((t) => t !== type)
            : [...filters.types, type];
        onFiltersChange({ ...filters, types: updated });
    };

    const toggleTag = (tag: string) => {
        const updated = filters.tags.includes(tag)
            ? filters.tags.filter((t) => t !== tag)
            : [...filters.tags, tag];
        onFiltersChange({ ...filters, tags: updated });
    };

    const togglePerson = (person: string) => {
        const updated = filters.people.includes(person)
            ? filters.people.filter((p) => p !== person)
            : [...filters.people, person];
        onFiltersChange({ ...filters, people: updated });
    };

    const setStatus = (status: string | null) => {
        onFiltersChange({
            ...filters,
            status: filters.status === status ? null : status,
        });
    };

    const clearFilters = () => {
        onFiltersChange({ types: [], status: null, tags: [], people: [] });
    };

    const activeFilterCount =
        filters.types.length +
        (filters.status ? 1 : 0) +
        filters.tags.length +
        filters.people.length;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider">
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs">
                            {activeFilterCount}
                        </span>
                    )}
                </span>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-brand-500 hover:underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Type Filters */}
            <div>
                <span className="text-2xs text-vox-text-muted uppercase tracking-wider mb-1.5 block">
                    Type
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {MEMORY_TYPES.map((type) => (
                        <button
                            key={type.key}
                            onClick={() => toggleType(type.key)}
                            className={`
                flex items-center gap-1 px-2.5 py-1
                rounded-lg text-xs font-medium
                transition-all duration-200 active:scale-95
                ${filters.types.includes(type.key)
                                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                    : 'bg-vox-surface text-vox-text-secondary hover:bg-vox-surface-hover border border-transparent'
                                }
              `}
                        >
                            <span className="text-sm">{type.icon}</span>
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status Filters */}
            <div>
                <span className="text-2xs text-vox-text-muted uppercase tracking-wider mb-1.5 block">
                    Status
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((status) => (
                        <button
                            key={status.key}
                            onClick={() => setStatus(status.key)}
                            className={`
                flex items-center gap-1 px-2.5 py-1
                rounded-lg text-xs font-medium
                transition-all duration-200 active:scale-95
                ${filters.status === status.key
                                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                    : 'bg-vox-surface text-vox-text-secondary hover:bg-vox-surface-hover border border-transparent'
                                }
              `}
                        >
                            <span className="text-sm">{status.icon}</span>
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
                <div>
                    <span className="text-2xs text-vox-text-muted uppercase tracking-wider mb-1.5 block">
                        Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                        {availableTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`
                  px-2.5 py-1 rounded-lg text-xs font-medium
                  transition-all duration-200 active:scale-95
                  ${filters.tags.includes(tag)
                                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                        : 'bg-vox-surface text-vox-text-secondary hover:bg-vox-surface-hover border border-transparent'
                                    }
                `}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* People */}
            {availablePeople.length > 0 && (
                <div>
                    <span className="text-2xs text-vox-text-muted uppercase tracking-wider mb-1.5 block">
                        People
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                        {availablePeople.map((person) => (
                            <button
                                key={person}
                                onClick={() => togglePerson(person)}
                                className={`
                  flex items-center gap-1 px-2.5 py-1
                  rounded-lg text-xs font-medium
                  transition-all duration-200 active:scale-95
                  ${filters.people.includes(person)
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'bg-vox-surface text-vox-text-secondary hover:bg-vox-surface-hover border border-transparent'
                                    }
                `}
                            >
                                <span className="text-sm">👤</span>
                                {person}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Apply Button (when filters changed and there's a query) */}
            {activeFilterCount > 0 && (
                <button
                    onClick={onApply}
                    className="btn-primary w-full py-2.5 text-sm"
                >
                    Apply Filters
                </button>
            )}
        </div>
    );
}
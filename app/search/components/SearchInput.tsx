// app/search/components/SearchInput.tsx
'use client';

import { useRef, useEffect } from 'react';
import type { SearchMode } from '../SearchPageClient';

interface SearchInputProps {
    query: string;
    onQueryChange: (query: string) => void;
    onSearch: (query?: string) => void;
    onClear: () => void;
    loading: boolean;
    mode: SearchMode;
    onModeChange: (mode: SearchMode) => void;
    onToggleFilters: () => void;
    isFiltered: boolean;
}

export default function SearchInput({
    query,
    onQueryChange,
    onSearch,
    onClear,
    loading,
    mode,
    onModeChange,
    onToggleFilters,
    isFiltered,
}: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            e.preventDefault();
            onSearch();
        }

        if (e.key === 'Escape') {
            if (query) {
                onClear();
            } else {
                inputRef.current?.blur();
            }
        }
    };

    const modes: { key: SearchMode; label: string; icon: string; description: string; isPro?: boolean }[] = [
        {
            key: 'deep',
            label: 'Deep Search',
            icon: '🧠',
            description: 'Reasoning-heavy AI analysis across all your memories',
            isPro: true,
        },
        {
            key: 'ask',
            label: 'Ask AI',
            icon: '💬',
            description: 'Get an AI-powered answer from your memories',
        },
        {
            key: 'search',
            label: 'Search',
            icon: '🔍',
            description: 'Find matching memories by similarity',
        },
        {
            key: 'browse',
            label: 'Browse',
            icon: '📂',
            description: 'Filter and browse all memories',
        },
    ];

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
                {/* Search Icon */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg
                            className="w-5 h-5 text-vox-text-tertiary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    )}
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        mode === 'deep'
                            ? 'Reason about multiple memories (Premium)...'
                            : mode === 'ask'
                                ? 'Ask anything about your memories...'
                                : mode === 'search'
                                    ? 'Search your memories...'
                                    : 'Filter your memories...'
                    }
                    className="
            w-full pl-12 pr-24 py-3.5
            bg-vox-surface border border-vox-border rounded-2xl
            text-vox-text placeholder-vox-text-muted
            focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
            transition-all duration-200
            text-base
          "
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                />

                {/* Right side buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Clear button */}
                    {query && (
                        <button
                            onClick={onClear}
                            className="
                w-8 h-8 rounded-lg
                flex items-center justify-center
                text-vox-text-muted hover:text-vox-text-secondary
                hover:bg-vox-surface-hover
                transition-all duration-200
                active:scale-90
              "
                            aria-label="Clear search"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    {/* Filter button */}
                    <button
                        onClick={onToggleFilters}
                        className={`
              w-8 h-8 rounded-lg
              flex items-center justify-center
              transition-all duration-200
              active:scale-90
              ${isFiltered
                                ? 'text-brand-500 bg-brand-500/10'
                                : 'text-vox-text-muted hover:text-vox-text-secondary hover:bg-vox-surface-hover'
                            }
            `}
                        aria-label="Toggle filters"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {isFiltered && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full" />
                        )}
                    </button>

                    {/* Search button */}
                    <button
                        onClick={() => onSearch()}
                        disabled={!query.trim() || loading}
                        className="
              w-8 h-8 rounded-lg
              flex items-center justify-center
              bg-brand-500 text-white
              hover:bg-brand-600
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200
              active:scale-90
            "
                        aria-label="Search"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {modes.map((m) => (
                    <button
                        key={m.key}
                        onClick={() => onModeChange(m.key)}
                        title={m.description}
                        className={`
              flex items-center gap-1.5 px-3 py-1.5
              rounded-xl text-xs font-medium whitespace-nowrap
              transition-all duration-200 active:scale-95
              ${mode === m.key
                                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                : 'bg-vox-surface text-vox-text-secondary hover:bg-vox-surface-hover border border-transparent'
                            }
            `}
                    >
                        <span>{m.icon}</span>
                        {m.label}
                        {m.isPro && (
                            <span className="
                                ml-1 px-1 py-0.5 
                                bg-amber-500/20 text-amber-500 
                                text-[8px] font-black uppercase tracking-tighter 
                                rounded-sm border border-amber-500/30
                            ">
                                Pro
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
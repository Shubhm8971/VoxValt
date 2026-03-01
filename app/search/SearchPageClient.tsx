// app/search/SearchPageClient.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from './components/SearchInput';
import FilterBar from './components/FilterBar';
import SearchResults from './components/SearchResults';
import AIAnswer from './components/AIAnswer';
import RecentMemories from './components/RecentMemories';
import SearchSuggestions from './components/SearchSuggestions';
import EmptySearch from './components/EmptySearch';

// ============================================
// Types
// ============================================
export interface Memory {
    id: string;
    content: string;
    type: string;
    status: string;
    priority: string;
    due_date?: string | null;
    people: string[];
    tags: string[];
    created_at: string;
    similarity?: number;
}

export interface SearchFilters {
    types: string[];
    status: string | null;
    tags: string[];
    people: string[];
}

export type SearchMode = 'ask' | 'search' | 'browse' | 'deep';

interface SearchPageClientProps {
    recentMemories: Memory[];
    availableTags: string[];
    availablePeople: string[];
    totalMemories: number;
}

// ============================================
// Main Search Page Component
// ============================================
export default function SearchPageClient({
    recentMemories,
    availableTags,
    availablePeople,
    totalMemories,
}: SearchPageClientProps) {
    const router = useRouter();

    // State
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<SearchMode>('ask');
    const [results, setResults] = useState<Memory[]>([]);
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        types: [],
        status: null,
        tags: [],
        people: [],
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Load search history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('voxvalt-search-history');
            if (saved) setSearchHistory(JSON.parse(saved));
        } catch { }
    }, []);

    // Save search to history
    const addToHistory = useCallback((searchQuery: string) => {
        setSearchHistory((prev) => {
            const updated = [
                searchQuery,
                ...prev.filter((q) => q.toLowerCase() !== searchQuery.toLowerCase()),
            ].slice(0, 10); // Keep last 10

            try {
                localStorage.setItem('voxvalt-search-history', JSON.stringify(updated));
            } catch { }

            return updated;
        });
    }, []);

    // Clear search history
    const clearHistory = useCallback(() => {
        setSearchHistory([]);
        try {
            localStorage.removeItem('voxvalt-search-history');
        } catch { }
    }, []);

    // ============================================
    // Search Function
    // ============================================
    const performSearch = useCallback(
        async (searchQuery?: string) => {
            const q = (searchQuery || query).trim();
            if (!q) return;

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            setLoading(true);
            setError(null);
            setAiAnswer(null);
            setHasSearched(true);

            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: q,
                        mode,
                        filters: hasActiveFilters(filters) ? filters : undefined,
                    }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Search failed');
                }

                const data = await response.json();

                setResults(data.memories || []);
                setAiAnswer(data.answer || null);
                addToHistory(q);
            } catch (err: any) {
                if (err.name === 'AbortError') return; // Cancelled — ignore
                console.error('Search error:', err);
                setError(err.message || 'Something went wrong. Please try again.');
            } finally {
                setLoading(false);
                abortControllerRef.current = null;
            }
        },
        [query, mode, filters, addToHistory]
    );

    // ============================================
    // Handle memory actions
    // ============================================
    const handleComplete = useCallback(async (id: string) => {
        try {
            const res = await fetch('/api/memories/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                setResults((prev) =>
                    prev.map((m) =>
                        m.id === id ? { ...m, status: 'completed' } : m
                    )
                );
            }
        } catch (err) {
            console.error('Failed to complete:', err);
        }
    }, []);

    const handleArchive = useCallback(async (id: string) => {
        try {
            const res = await fetch('/api/memories/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                setResults((prev) => prev.filter((m) => m.id !== id));
            }
        } catch (err) {
            console.error('Failed to archive:', err);
        }
    }, []);

    // ============================================
    // Clear search
    // ============================================
    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
        setAiAnswer(null);
        setHasSearched(false);
        setError(null);
        setFilters({ types: [], status: null, tags: [], people: [] });
        setShowFilters(false);
    }, []);

    // ============================================
    // Derived state
    // ============================================
    const isFiltered = hasActiveFilters(filters);
    const showSuggestions = !hasSearched && !loading && query.length === 0;
    const showRecent = !hasSearched && !loading;
    const showResults = hasSearched && !loading;
    const noResults = hasSearched && !loading && results.length === 0 && !error;

    return (
        <main className="min-h-screen-dvh bg-vox-bg bg-mesh-gradient">
            {/* Header */}
            <header className="sticky top-0 z-sticky bg-vox-bg/80 backdrop-blur-xl border-b border-vox-border pt-safe">
                <div className="px-4 sm:px-6">
                    {/* Top Row: Back + Title */}
                    <div className="flex items-center gap-3 h-14">
                        <button
                            onClick={() => router.push('/')}
                            className="
                w-10 h-10 rounded-xl
                flex items-center justify-center
                hover:bg-vox-surface active:scale-95
                transition-all duration-200
              "
                            aria-label="Go back"
                        >
                            <svg
                                className="w-5 h-5 text-vox-text-secondary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        <h1 className="text-lg font-semibold text-vox-text flex-1">
                            Search Memories
                        </h1>

                        <span className="text-xs text-vox-text-muted">
                            {totalMemories} memories
                        </span>
                    </div>

                    {/* Search Input */}
                    <div className="pb-3">
                        <SearchInput
                            query={query}
                            onQueryChange={setQuery}
                            onSearch={performSearch}
                            onClear={clearSearch}
                            loading={loading}
                            mode={mode}
                            onModeChange={setMode}
                            onToggleFilters={() => setShowFilters((prev) => !prev)}
                            isFiltered={isFiltered}
                        />
                    </div>

                    {/* Filter Bar */}
                    {showFilters && (
                        <div className="pb-3 animate-fade-in-down">
                            <FilterBar
                                filters={filters}
                                onFiltersChange={setFilters}
                                availableTags={availableTags}
                                availablePeople={availablePeople}
                                onApply={() => {
                                    if (query.trim()) performSearch();
                                }}
                            />
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className="px-4 sm:px-6 py-4 pb-bottom-nav pb-safe">
                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                        <div className="flex items-start gap-3">
                            <span className="text-lg">⚠️</span>
                            <div className="flex-1">
                                <p className="text-red-400 text-sm font-medium">
                                    Search failed
                                </p>
                                <p className="text-red-400/70 text-xs mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => performSearch()}
                                className="text-xs text-red-400 underline hover:text-red-300"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && <SearchSkeleton />}

                {/* AI Answer */}
                {aiAnswer && !loading && (
                    <div className="mb-6 animate-fade-in-up">
                        <AIAnswer
                            answer={aiAnswer}
                            query={query}
                            resultCount={results.length}
                            isDeep={mode === 'deep'}
                        />
                    </div>
                )}

                {/* Search Results */}
                {showResults && results.length > 0 && (
                    <div className="animate-fade-in-up">
                        <SearchResults
                            results={results}
                            query={query}
                            onComplete={handleComplete}
                            onArchive={handleArchive}
                        />
                    </div>
                )}

                {/* No Results */}
                {noResults && !aiAnswer && (
                    <EmptySearch query={query} onClear={clearSearch} />
                )}

                {/* Suggestions (before searching) */}
                {showSuggestions && (
                    <SearchSuggestions
                        searchHistory={searchHistory}
                        onSelect={(suggestion) => {
                            setQuery(suggestion);
                            performSearch(suggestion);
                        }}
                        onClearHistory={clearHistory}
                    />
                )}

                {/* Recent Memories (before searching) */}
                {showRecent && query.length === 0 && (
                    <div className="mt-6">
                        <RecentMemories
                            memories={recentMemories}
                            onComplete={handleComplete}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

// ============================================
// Helper
// ============================================
function hasActiveFilters(filters: SearchFilters): boolean {
    return (
        filters.types.length > 0 ||
        filters.status !== null ||
        filters.tags.length > 0 ||
        filters.people.length > 0
    );
}

// ============================================
// Loading Skeleton
// ============================================
function SearchSkeleton() {
    return (
        <div className="space-y-4 animate-fade-in">
            {/* AI Answer skeleton */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="skeleton w-6 h-6 rounded-lg" />
                    <div className="skeleton h-4 w-32 rounded" />
                </div>
                <div className="space-y-2">
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-4/5 rounded" />
                    <div className="skeleton h-3 w-3/5 rounded" />
                </div>
            </div>

            {/* Result skeletons */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="vox-card p-4">
                    <div className="flex items-start gap-3">
                        <div className="skeleton w-8 h-8 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                                <div className="skeleton h-5 w-16 rounded-full" />
                                <div className="skeleton h-5 w-20 rounded-full" />
                            </div>
                            <div className="skeleton h-3 w-full rounded" />
                            <div className="skeleton h-3 w-3/4 rounded" />
                            <div className="skeleton h-3 w-24 rounded mt-1" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
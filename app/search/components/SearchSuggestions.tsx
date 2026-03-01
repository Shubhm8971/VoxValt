// app/search/components/SearchSuggestions.tsx
'use client';

interface SearchSuggestionsProps {
    searchHistory: string[];
    onSelect: (suggestion: string) => void;
    onClearHistory: () => void;
}

const QUICK_SUGGESTIONS = [
    { label: "What did I promise?", icon: "🤝" },
    { label: "Tasks due today", icon: "📋" },
    { label: "What happened yesterday?", icon: "📅" },
    { label: "Things to remember", icon: "💭" },
    { label: "Ideas I had", icon: "💡" },
    { label: "Pending payments", icon: "💰" },
    { label: "People I need to call", icon: "📞" },
    { label: "Important deadlines", icon: "⏰" },
];

export default function SearchSuggestions({
    searchHistory,
    onSelect,
    onClearHistory,
}: SearchSuggestionsProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Search History */}
            {searchHistory.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider">
                            Recent Searches
                        </h3>
                        <button
                            onClick={onClearHistory}
                            className="text-xs text-vox-text-muted hover:text-brand-500 transition-colors"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="space-y-1">
                        {searchHistory.map((query, i) => (
                            <button
                                key={i}
                                onClick={() => onSelect(query)}
                                className="
                  w-full flex items-center gap-3 px-3 py-2.5
                  rounded-xl text-left
                  hover:bg-vox-surface active:scale-[0.99]
                  transition-all duration-200
                  group
                "
                            >
                                <svg
                                    className="w-4 h-4 text-vox-text-muted flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span className="text-sm text-vox-text-secondary group-hover:text-vox-text truncate">
                                    {query}
                                </span>
                                <svg
                                    className="w-4 h-4 text-vox-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 17l9.2-9.2M17 17V7H7"
                                    />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Suggestions */}
            <div>
                <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-3">
                    Try asking
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_SUGGESTIONS.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(suggestion.label)}
                            className="
                flex items-center gap-2.5 px-4 py-3
                glass-card-hover rounded-xl text-left
                active:scale-[0.98]
                transition-all duration-200
              "
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                            <span className="text-sm text-vox-text-secondary">
                                {suggestion.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="glass-card p-4">
                <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-2">
                    💡 Search Tips
                </h3>
                <ul className="space-y-1.5">
                    {[
                        'Use natural language — ask like you\'d ask a friend',
                        '"Ask AI" mode gives you a summarized answer',
                        '"Search" mode shows individual matching memories',
                        'Use filters to narrow by type, person, or tag',
                    ].map((tip, i) => (
                        <li key={i} className="text-xs text-vox-text-muted flex items-start gap-2">
                            <span className="text-vox-text-tertiary mt-0.5">•</span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
// app/search/components/EmptySearch.tsx
'use client';

interface EmptySearchProps {
    query: string;
    onClear: () => void;
}

export default function EmptySearch({ query, onClear }: EmptySearchProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in-up">
            <div className="text-6xl mb-4 opacity-40">🔍</div>

            <h3 className="text-lg font-semibold text-vox-text mb-2">
                No memories found
            </h3>

            <p className="text-sm text-vox-text-secondary text-center max-w-xs mb-6">
                Nothing matched <span className="italic text-vox-text">"{query}"</span>.
                Try different words or broaden your search.
            </p>

            <div className="space-y-3 w-full max-w-xs">
                <button onClick={onClear} className="btn-primary w-full py-3 text-sm">
                    Clear Search
                </button>

                <div className="text-center">
                    <p className="text-xs text-vox-text-muted mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {['Use fewer words', 'Try synonyms', 'Remove filters', 'Check spelling'].map(
                            (tip, i) => (
                                <span
                                    key={i}
                                    className="text-2xs px-2.5 py-1 rounded-full bg-vox-surface text-vox-text-muted"
                                >
                                    {tip}
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
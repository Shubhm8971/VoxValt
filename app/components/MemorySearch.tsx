'use client';

import { useState } from 'react';
import { Search, Sparkles, Loader } from 'lucide-react';

interface MemoryResult {
    id: string;
    content: string;
    type: string;
    similarity: number;
}

export function MemorySearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MemoryResult[]>([]);
    const [answer, setAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);
        setAnswer(null);
        setHasSearched(true);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, mode: 'ask' }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data.memories || []);
                setAnswer(data.answer || null);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-elevated p-6 mb-8 border border-brand-500/10 bg-mesh-gradient-light">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                    <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-vox-text">Ask VoxValt Memory</h3>
            </div>

            <form onSubmit={handleSearch} className="relative mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'What did I say about the rent?' or 'Do I have any promises?'"
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-transparent transition-all outline-none text-vox-text"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-3 bg-brand-gradient text-white rounded-lg hover:shadow-glow transition-all active:scale-95 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? (
                        <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </button>
            </form>

            {/* AI Answer */}
            {answer && (
                <div className="mb-8 p-6 bg-brand-500/5 rounded-2xl border border-brand-500/10 animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded tracking-wider uppercase">AI Analysis</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-vox-text prose-headings:text-vox-text prose-strong:text-brand-600 prose-headings:font-bold">
                        {answer.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0 leading-relaxed">{line}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {hasSearched && !loading && (
                <div className="mt-4 space-y-4">
                    <h4 className="text-[10px] font-bold text-vox-text-muted uppercase tracking-widest pl-1">Relevant Memories</h4>
                    {results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {results.map((result) => (
                                <div
                                    key={result.id}
                                    className="p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-500/20 hover:shadow-sm transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-brand-500 bg-brand-500/5 px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                {result.type}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400">
                                            {Math.round((result.similarity || 0) * 100)}% Match
                                        </span>
                                    </div>
                                    <p className="text-vox-text-secondary text-sm line-clamp-2 leading-relaxed group-hover:text-vox-text transition-colors">{result.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 text-sm">No exact matches found in your archive.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

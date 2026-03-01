// components/memory-search.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface Memory {
    id: string;
    content: string;
    type: string;
    similarity: number;
}

export default function MemorySearch() {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<'search' | 'ask'>('ask');
    const [memories, setMemories] = useState<Memory[]>([]);
    const [answer, setAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const search = useCallback(async () => {
        if (!query.trim()) return;

        setLoading(true);
        setAnswer(null);

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim(), mode }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setMemories(data.memories || []);
            setAnswer(data.answer || null);
        } catch (err: any) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [query, mode]);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder="What did I say about the marketing budget?"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-indigo-500
                     text-gray-800 placeholder-gray-400"
                />
                <button
                    onClick={search}
                    disabled={loading || !query.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl
                     hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                >
                    {loading ? '...' : mode === 'ask' ? 'Ask' : 'Search'}
                </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mt-3">
                {(['ask', 'search'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${mode === m
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {m === 'ask' ? '💬 Ask AI' : '🔍 Raw Search'}
                    </button>
                ))}
            </div>

            {/* AI Answer */}
            {answer && (
                <div className="mt-6 p-5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <h3 className="text-sm font-semibold text-indigo-600 mb-2">🧠 VoxValt says:</h3>
                    <div
                        className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: answer }}
                    />
                </div>
            )}

            {/* Memory Results */}
            {memories.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Matching Memories ({memories.length})
                    </h3>
                    {memories.map((memory) => (
                        <div
                            key={memory.id}
                            className="p-4 bg-white border rounded-xl hover:shadow-md transition"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase text-gray-500">
                                    {memory.type}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {(memory.similarity * 100).toFixed(0)}% match
                                </span>
                            </div>
                            <p className="text-gray-800 text-sm">{memory.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
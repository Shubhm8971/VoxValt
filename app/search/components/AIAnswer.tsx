// app/search/components/AIAnswer.tsx
'use client';

import { useState } from 'react';

interface AIAnswerProps {
    answer: string;
    query: string;
    resultCount: number;
    isDeep?: boolean;
}

export default function AIAnswer({ answer, query, resultCount, isDeep }: AIAnswerProps) {
    const [expanded, setExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    // Simple markdown-to-JSX renderer
    const renderAnswer = (text: string) => {
        const lines = text.split('\n');
        const rendered: React.ReactNode[] = [];
        let inTable = false;
        let tableRows: string[] = [];

        const flushTable = (key: number) => {
            if (tableRows.length === 0) return null;
            const rows = tableRows.map(row => row.split('|').filter(c => c.trim() !== '').map(c => c.trim()));
            const hasHeader = tableRows.length > 1 && tableRows[1].includes('---');

            const table = (
                <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-vox-border">
                    <table className="w-full text-left text-xs border-collapse">
                        {hasHeader && (
                            <thead>
                                <tr className="bg-vox-surface">
                                    {rows[0].map((cell, idx) => (
                                        <th key={idx} className="p-2 border-b border-vox-border font-bold text-vox-text">{cell}</th>
                                    ))}
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {rows.slice(hasHeader ? 2 : 0).map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-vox-border/30 last:border-0 hover:bg-vox-surface/50">
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-2 text-vox-text-secondary">{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            tableRows = [];
            inTable = false;
            return table;
        };

        lines.forEach((line, i) => {
            // Table detection
            if (line.includes('|') && (line.trim().startsWith('|') || line.trim().endsWith('|'))) {
                inTable = true;
                tableRows.push(line);
                return;
            } else if (inTable) {
                rendered.push(flushTable(i));
            }

            // Headers
            if (line.startsWith('### ')) {
                rendered.push(
                    <h4 key={i} className="text-sm font-bold text-vox-text mt-3 mb-1">
                        {line.replace('### ', '')}
                    </h4>
                );
            } else if (line.startsWith('## ')) {
                rendered.push(
                    <h3 key={i} className="text-base font-bold text-vox-text mt-4 mb-1.5">
                        {line.replace('## ', '')}
                    </h3>
                );
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                rendered.push(
                    <li key={i} className="text-sm text-vox-text-secondary ml-4 list-disc mb-1">
                        {renderInlineFormatting(line.replace(/^[-*]\s/, ''))}
                    </li>
                );
            } else if (/^\d+\.\s/.test(line)) {
                rendered.push(
                    <li key={i} className="text-sm text-vox-text-secondary ml-4 list-decimal mb-1">
                        {renderInlineFormatting(line.replace(/^\d+\.\s/, ''))}
                    </li>
                );
            } else if (line.trim() === '') {
                rendered.push(<div key={i} className="h-2" />);
            } else {
                rendered.push(
                    <p key={i} className="text-sm text-vox-text-secondary leading-relaxed mb-1">
                        {renderInlineFormatting(line)}
                    </p>
                );
            }
        });

        if (inTable) rendered.push(flushTable(9999));

        return rendered;
    };

    // Render bold and inline code
    const renderInlineFormatting = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={i} className="font-semibold text-vox-text">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-vox-surface text-brand-400 text-xs font-mono"
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }
            return part;
        });
    };

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-0">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDeep ? 'bg-amber-500 shadow-glow-sm shadow-amber-500/20' : 'bg-brand-gradient'}`}>
                        <span className="text-sm">{isDeep ? '🧠' : '💬'}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-vox-text flex items-center gap-2">
                            {isDeep ? 'Deep Reasoning Analysis' : 'VoxValt AI'}
                            {isDeep && (
                                <span className="px-1 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-tighter rounded border border-amber-500/20">
                                    Pro
                                </span>
                            )}
                        </h3>
                        <p className="text-2xs text-vox-text-muted">
                            {isDeep ? 'Advanced synthesis of ' : 'Based on '}
                            {resultCount} matching {resultCount === 1 ? 'memory' : 'memories'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className="
              w-8 h-8 rounded-lg flex items-center justify-center
              text-vox-text-muted hover:text-vox-text-secondary hover:bg-vox-surface
              transition-all duration-200 active:scale-90
            "
                        title={copied ? 'Copied!' : 'Copy answer'}
                    >
                        {copied ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>

                    {/* Collapse button */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="
              w-8 h-8 rounded-lg flex items-center justify-center
              text-vox-text-muted hover:text-vox-text-secondary hover:bg-vox-surface
              transition-all duration-200 active:scale-90
            "
                    >
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Answer Content */}
            {expanded && (
                <div className="p-4 pt-3">
                    <div className="prose-sm max-w-none">{renderAnswer(answer)}</div>

                    {/* Query echo */}
                    <div className="mt-4 pt-3 border-t border-vox-border">
                        <p className="text-2xs text-vox-text-muted">
                            You asked: <span className="italic">"{query}"</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
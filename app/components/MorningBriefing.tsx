'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, X, Volume2, Square, Loader2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

export default function MorningBriefing() {
    const searchParams = useSearchParams();
    const showBriefing = searchParams.get('showBriefing');
    const { speak, stop, isSpeaking } = useTextToSpeech();

    // State Management
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [briefing, setBriefing] = useState('');
    const [logId, setLogId] = useState<string | null>(null);
    const [sentiment, setSentiment] = useState<string | null>(null);
    const hasAutoPlayed = useRef(false);

    const fetchBriefing = useCallback(async () => {
        setLoading(true);
        setIsVisible(true);
        try {
            const res = await fetch('/api/briefing/summary');
            const data = await res.json();

            setBriefing(data.summary);
            setLogId(data.logId);
            setSentiment(data.sentiment);

            // Handle Auto-Play logic
            if (data.autoPlay && !hasAutoPlayed.current) {
                hasAutoPlayed.current = true;
                // Small delay to allow the UI to settle and user to see the banner
                setTimeout(() => {
                    handleListen(data.summary, data.logId);
                }, 800);
            }
        } catch (err) {
            setBriefing("Good morning! I couldn't load your summary, but you have a productive day ahead.");
        } finally {
            setLoading(false);
        }
    }, [speak]);

    useEffect(() => {
        if (showBriefing === 'true') {
            fetchBriefing();
        }
    }, [showBriefing, fetchBriefing]);

    const handleListen = async (textToSpeak?: string, specificLogId?: string) => {
        const currentBriefing = textToSpeak || briefing;
        const currentLogId = specificLogId || logId;

        if (isSpeaking) {
            stop();
            return;
        }

        speak(currentBriefing);

        // Log the "Listen" interaction in Supabase
        if (currentLogId) {
            await fetch('/api/briefing/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId: currentLogId, action: 'listen' }),
            });
        }
    };

    const handleDismiss = async () => {
        stop();
        setIsVisible(false);

        // Log the "Read/Dismiss" interaction
        if (logId) {
            await fetch('/api/briefing/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId, action: 'read' }),
            });
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 inset-x-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                <div className="p-5 text-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                <h3 className="font-bold text-lg tracking-tight text-white">Morning Briefing</h3>
                            </div>
                            {sentiment && !loading && (
                                <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full w-fit text-indigo-50 border border-white/10 font-medium">
                                    Vibe: {sentiment}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {!loading && briefing && (
                                <button
                                    onClick={() => handleListen()}
                                    className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-yellow-400 text-indigo-900 scale-110' : 'hover:bg-white/10 text-indigo-100'}`}
                                >
                                    {isSpeaking ? <Square className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                            )}

                            <button
                                onClick={handleDismiss}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-4 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
                            <p className="text-sm text-indigo-100 animate-pulse">Synthesizing your memories...</p>
                        </div>
                    ) : (
                        <p className="text-indigo-50 leading-relaxed font-medium text-base pr-2">
                            {briefing}
                        </p>
                    )}
                </div>

                {/* Voice Visualizer Bar */}
                {isSpeaking && (
                    <div className="bg-black/20 px-5 py-2 flex items-center gap-3">
                        <div className="flex items-end gap-1 h-3">
                            {[0.2, 0.4, 0.6, 0.3].map((delay, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-yellow-300 animate-bounce"
                                    style={{ animationDelay: `${delay}s`, height: '100%' }}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-yellow-200 font-bold uppercase tracking-widest">Assistant Reading Aloud</span>
                    </div>
                )}

                {!loading && !isSpeaking && (
                    <div className="bg-white/5 px-5 py-2 text-[11px] text-indigo-200/70 italic border-t border-white/5">
                        Powered by VoxValt AI Memory Engine
                    </div>
                )}
            </div>
        </div>
    );
}
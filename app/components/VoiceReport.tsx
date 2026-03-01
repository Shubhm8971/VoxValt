// app/components/VoiceReport.tsx
'use client';

import {
    Sparkles,
    X,
    Volume2,
    MessageSquare,
    Play,
    Pause
} from 'lucide-react';
import { useState } from 'react';

interface VoiceReportProps {
    reportText: string;
    onClose: () => void;
}

export function VoiceReport({ reportText, onClose }: VoiceReportProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSpeak = () => {
        if (!window.speechSynthesis) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(reportText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="fixed inset-x-4 bottom-24 z-50 animate-slide-up">
            <div className="max-w-xl mx-auto glass-card p-6 border border-brand-500/30 shadow-2xl shadow-brand-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center shadow-glow shadow-brand-500/30">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-vox-text uppercase tracking-widest">AI Intelligence Report</h3>
                            <p className="text-[10px] text-brand-400 font-bold uppercase">Proactive Insight Generated</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-vox-surface rounded-full transition-colors text-vox-text-secondary"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-brand-gradient rounded-full opacity-50" />
                    <p className="text-vox-text leading-relaxed pl-5 font-medium italic">
                        "{reportText}"
                    </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        onClick={handleSpeak}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all
                            ${isPlaying
                                ? 'bg-vox-surface text-brand-400 border border-brand-500/30'
                                : 'bg-brand-gradient text-white shadow-glow shadow-brand-500/20 hover:scale-105 active:scale-95'}
                        `}
                    >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                        {isPlaying ? 'Pause Audio' : 'Listen to Report'}
                    </button>

                    <button className="p-2.5 bg-vox-surface border border-vox-border rounded-full hover:border-brand-500/50 transition-colors group">
                        <MessageSquare size={16} className="text-vox-text-secondary group-hover:text-brand-400" />
                    </button>

                    <div className="ml-auto">
                        <div className="flex gap-1">
                            <div className="w-1 h-3 bg-brand-500/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 h-5 bg-brand-500/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1 h-3 bg-brand-500/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// app/landing/components/DemoSection.tsx
'use client';

import { useState } from 'react';

const DEMO_STEPS = [
    {
        voice: "Hey, I need to send the quarterly report to Priya by Friday. Also, remind me to call the electrician tomorrow morning. Oh, and I promised Rahul I'd review his code tonight.",
        delay: 0,
    },
];

const DEMO_RESULTS = [
    { icon: '📋', type: 'Task', text: 'Send quarterly report to Priya', due: 'Friday', badge: 'badge-task' },
    { icon: '⏰', type: 'Reminder', text: 'Call the electrician', due: 'Tomorrow AM', badge: 'badge-reminder' },
    { icon: '🤝', type: 'Promise', text: "Review Rahul's code", due: 'Tonight', badge: 'badge-promise' },
];

export default function DemoSection() {
    const [playing, setPlaying] = useState(false);
    const [step, setStep] = useState(0);

    const startDemo = () => {
        setPlaying(true);
        setStep(0);

        setTimeout(() => setStep(1), 1000);
        setTimeout(() => setStep(2), 2500);
        setTimeout(() => setStep(3), 4000);
        setTimeout(() => {
            setPlaying(false);
        }, 6000);
    };

    return (
        <section id="demo" className="py-20 sm:py-28 relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-vox-text mb-4">
                        See it in action
                    </h2>
                    <p className="text-lg text-vox-text-secondary max-w-xl mx-auto">
                        One voice note. Three items extracted. Zero effort.
                    </p>
                </div>

                <div className="glass-card p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto">
                    {/* Voice input */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-3 h-3 rounded-full ${playing ? 'bg-red-500 animate-pulse' : 'bg-vox-text-muted'}`} />
                            <span className="text-xs text-vox-text-muted uppercase tracking-wider font-medium">
                                {playing ? 'Recording...' : 'Voice Note'}
                            </span>
                        </div>

                        <div className="p-4 rounded-xl bg-vox-surface/50 border border-vox-border">
                            <p className={`text-sm text-vox-text leading-relaxed italic transition-opacity duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                                "{DEMO_STEPS[0].voice}"
                            </p>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center mb-6">
                        <div className={`flex flex-col items-center gap-1 transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                                <span className="text-sm">🧠</span>
                            </div>
                            <svg className="w-4 h-8 text-brand-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-2.5">
                        {DEMO_RESULTS.map((result, i) => (
                            <div
                                key={i}
                                className={`
                  vox-card p-3.5 flex items-center gap-3
                  transition-all duration-500
                  ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
                                style={{ transitionDelay: `${i * 150}ms` }}
                            >
                                <span className="text-lg">{result.icon}</span>
                                <div className="flex-1">
                                    <span className={`${result.badge} text-2xs`}>{result.type}</span>
                                    <p className="text-sm text-vox-text mt-0.5">{result.text}</p>
                                </div>
                                <span className="text-2xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">
                                    {result.due}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Play button */}
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={startDemo}
                            disabled={playing}
                            className="
                px-6 py-3 rounded-xl text-sm font-semibold
                bg-brand-500 text-white
                hover:bg-brand-600 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                shadow-glow-sm
              "
                        >
                            {playing ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : step >= 3 ? (
                                '🔄 Replay Demo'
                            ) : (
                                '▶ Play Demo'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
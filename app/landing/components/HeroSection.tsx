// app/landing/components/HeroSection.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const ROTATING_WORDS = [
    'deadlines',
    'promises',
    'commitments',
    'tasks',
    'meetings',
    'ideas',
];

export default function HeroSection() {
    const [wordIndex, setWordIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
                setIsVisible(true);
            }, 300);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-vox-bg to-transparent pointer-events-none" />

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 mb-8 animate-fade-in-down">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-sm text-brand-400 font-medium">
                        Voice-first memory for real life
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-vox-text leading-tight tracking-tight animate-fade-in-up">
                    Never forget
                    <br />
                    your{' '}
                    <span className="relative inline-block">
                        <span
                            className={`
                gradient-text transition-all duration-300
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
              `}
                        >
                            {ROTATING_WORDS[wordIndex]}
                        </span>
                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-brand-gradient rounded-full opacity-50" />
                    </span>
                    {' '}again
                </h1>

                {/* Subheadline */}
                <p
                    className="
            mt-6 sm:mt-8 text-lg sm:text-xl text-vox-text-secondary
            max-w-2xl mx-auto leading-relaxed
            animate-fade-in-up
          "
                    style={{ animationDelay: '100ms' }}
                >
                    VoxValt listens to your voice notes and automatically extracts
                    tasks, promises, and reminders.{' '}
                    <span className="text-vox-text font-medium">
                        Your second brain that actually remembers everything.
                    </span>
                </p>

                {/* CTA Buttons */}
                <div
                    className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-fade-in-up"
                    style={{ animationDelay: '200ms' }}
                >
                    <Link
                        href="/auth"
                        className="
              px-8 py-4 text-lg font-semibold text-white
              bg-brand-gradient rounded-2xl
              hover:opacity-90 active:scale-[0.98]
              transition-all duration-200
              shadow-glow hover:shadow-glow-lg
            "
                    >
                        Start Free →
                    </Link>
                    <a
                        href="#demo"
                        className="
              px-8 py-4 text-lg font-semibold text-vox-text
              bg-white/5 border border-white/10 rounded-2xl
              hover:bg-white/10 hover:border-white/20
              active:scale-[0.98]
              transition-all duration-200
            "
                    >
                        Watch Demo ▶
                    </a>
                </div>

                {/* Trust line */}
                <p
                    className="mt-6 text-sm text-vox-text-muted animate-fade-in-up"
                    style={{ animationDelay: '300ms' }}
                >
                    Free forever plan · No credit card required · Works in any browser
                </p>

                {/* Hero mockup */}
                <div
                    className="
            mt-16 relative max-w-lg mx-auto
            animate-fade-in-up
          "
                    style={{ animationDelay: '400ms' }}
                >
                    <div className="absolute inset-0 bg-brand-500/20 rounded-3xl blur-3xl scale-95" />
                    <div className="relative glass-card p-6 rounded-3xl border-brand-500/20">
                        {/* Fake app screenshot */}
                        <div className="bg-vox-bg rounded-2xl p-4 space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-vox-text">Hey Arjun 👋</p>
                                    <p className="text-2xs text-vox-text-muted">3 items need attention</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-brand-gradient" />
                            </div>

                            {/* Cards */}
                            {[
                                { icon: '🤝', type: 'Promise', text: 'Send project report to Rahul', badge: 'badge-promise', card: 'memory-card-promise' },
                                { icon: '📋', type: 'Task', text: 'Pay electricity bill before Thursday', badge: 'badge-task', card: 'memory-card-task' },
                                { icon: '⏰', type: 'Reminder', text: 'Call Mom on her birthday, March 15', badge: 'badge-reminder', card: 'memory-card-reminder' },
                            ].map((item, i) => (
                                <div key={i} className={`vox-card p-3 ${item.card}`}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-sm">{item.icon}</span>
                                        <div className="flex-1">
                                            <span className={`${item.badge} text-2xs`}>{item.type}</span>
                                            <p className="text-xs text-vox-text mt-1">{item.text}</p>
                                        </div>
                                        <button className="text-2xs px-2 py-1 rounded bg-green-500/10 text-green-400">✅</button>
                                    </div>
                                </div>
                            ))}

                            {/* Record button mockup */}
                            <div className="flex justify-center pt-2">
                                <div className="w-12 h-12 rounded-full bg-brand-gradient shadow-glow flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
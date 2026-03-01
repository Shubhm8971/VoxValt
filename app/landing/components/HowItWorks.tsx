// app/landing/components/HowItWorks.tsx
'use client';

const STEPS = [
    {
        number: '01',
        icon: '🎙️',
        title: 'Record',
        description: 'Tap once to record a voice note. Talk naturally about your day, tasks, or commitments. No typing needed.',
        color: 'from-blue-500/20 to-blue-500/5',
        border: 'border-blue-500/20',
        accent: 'text-blue-400',
    },
    {
        number: '02',
        icon: '🧠',
        title: 'Extract',
        description: 'AI instantly identifies tasks, promises you made to others, reminders, and ideas — all from your natural speech.',
        color: 'from-purple-500/20 to-purple-500/5',
        border: 'border-purple-500/20',
        accent: 'text-purple-400',
    },
    {
        number: '03',
        icon: '🔔',
        title: 'Remember',
        description: 'Get smart notifications at the right time. Search all your memories with natural language. Never drop the ball.',
        color: 'from-green-500/20 to-green-500/5',
        border: 'border-green-500/20',
        accent: 'text-green-400',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 sm:py-28 relative">
            <div className="absolute inset-0 bg-mesh-gradient opacity-30" />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
                        How it works
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-vox-text mb-4">
                        Three steps to a perfect memory
                    </h2>
                    <p className="text-lg text-vox-text-secondary max-w-xl mx-auto">
                        No learning curve. No complex setup. Just speak and let AI handle the rest.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                    {STEPS.map((step, i) => (
                        <div
                            key={i}
                            className={`
                relative p-8 rounded-3xl
                bg-gradient-to-b ${step.color}
                border ${step.border}
                group hover:scale-[1.02]
                transition-all duration-300
              `}
                        >
                            {/* Step number */}
                            <span className={`text-5xl font-black ${step.accent} opacity-20 absolute top-6 right-6`}>
                                {step.number}
                            </span>

                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-vox-bg/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <span className="text-3xl">{step.icon}</span>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-vox-text mb-3">{step.title}</h3>
                            <p className="text-sm text-vox-text-secondary leading-relaxed">
                                {step.description}
                            </p>

                            {/* Arrow connector (not on last) */}
                            {i < STEPS.length - 1 && (
                                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                                    <svg className="w-8 h-8 text-vox-text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
// app/landing/components/Features.tsx
'use client';

const FEATURES = [
    {
        icon: '🧠',
        title: 'AI-Powered Extraction',
        description: 'Gemini AI identifies tasks, promises, reminders, and ideas from natural speech — in any accent.',
    },
    {
        icon: '🔍',
        title: 'Semantic Search',
        description: 'Search your memories with natural language. "What did I promise Rahul last week?" — and get instant answers.',
    },
    {
        icon: '☀️',
        title: 'Morning Briefings',
        description: 'Wake up to a personalized daily summary of your agenda, pending promises, and overdue tasks.',
    },
    {
        icon: '🔔',
        title: 'Smart Notifications',
        description: 'Get reminded about promises before you break them. Overdue alerts. Due date warnings.',
    },
    {
        icon: '📱',
        title: 'Works Everywhere',
        description: 'Install as a PWA on any device. Works on iPhone, Android, laptop — all synced in real-time.',
    },
    {
        icon: '🔒',
        title: 'Private & Secure',
        description: 'Your memories are encrypted and only accessible to you. We never sell your data. Ever.',
    },
    {
        icon: '⚡',
        title: 'Instant Processing',
        description: 'Voice notes are transcribed and analyzed in seconds. Local extraction works even offline.',
    },
    {
        icon: '👥',
        title: 'People Tracking',
        description: 'VoxValt knows who you mentioned. Filter memories by person to see all related commitments.',
    },
    {
        icon: '📊',
        title: 'Completion Tracking',
        description: 'See your completion rate, track promises kept, and build accountability over time.',
    },
];

export default function Features() {
    return (
        <section id="features" className="py-20 sm:py-28 relative">
            <div className="absolute inset-0 bg-mesh-gradient opacity-20" />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
                        Features
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-vox-text mb-4">
                        Everything your brain wishes it could do
                    </h2>
                    <p className="text-lg text-vox-text-secondary max-w-xl mx-auto">
                        Powered by Google Gemini AI and vector search for human-like memory recall.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((feature, i) => (
                        <div
                            key={i}
                            className="
                glass-card-hover p-6
                group
              "
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all duration-300">
                                <span className="text-2xl">{feature.icon}</span>
                            </div>
                            <h3 className="text-base font-bold text-vox-text mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-vox-text-secondary leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
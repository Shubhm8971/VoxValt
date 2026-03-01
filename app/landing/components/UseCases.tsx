// app/landing/components/UseCases.tsx
'use client';

const EXAMPLES = [
    {
        voice: "Bhai, I'll send you the money tonight",
        result: '→ Promise detected • Reminder set for 9 PM',
        icon: '🤝',
        color: 'border-memory-promise',
    },
    {
        voice: 'Need to pay the electricity bill before Thursday',
        result: '→ Task created • Due: Thursday • Priority: High',
        icon: '📋',
        color: 'border-memory-task',
    },
    {
        voice: "Told my manager I'll finish the report by Monday",
        result: '→ Promise to manager • Deadline: Monday',
        icon: '🤝',
        color: 'border-memory-promise',
    },
    {
        voice: "Remember to call Mom on her birthday, March 15th",
        result: '→ Reminder set • March 15 • Recurring yearly',
        icon: '⏰',
        color: 'border-memory-reminder',
    },
    {
        voice: 'I should start going to the gym every morning',
        result: '→ Recurring task • Daily morning routine',
        icon: '🔄',
        color: 'border-memory-idea',
    },
    {
        voice: "Idea: what if we added a WhatsApp integration to the app",
        result: '→ Idea saved • Tagged: product, feature',
        icon: '💡',
        color: 'border-memory-idea',
    },
];

export default function UseCases() {
    return (
        <section className="py-20 sm:py-28">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
                        Real examples
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-vox-text mb-4">
                        Built for real life
                    </h2>
                    <p className="text-lg text-vox-text-secondary max-w-xl mx-auto">
                        Not just another notes app. VoxValt understands commitments, deadlines, and the things that actually matter.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {EXAMPLES.map((example, i) => (
                        <div
                            key={i}
                            className={`
                p-5 rounded-2xl
                bg-vox-surface/30 border-l-4 ${example.color}
                hover:bg-vox-surface/50
                transition-all duration-300
                group
              `}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                    {example.icon}
                                </span>
                                <div>
                                    <p className="text-sm text-vox-text italic leading-relaxed mb-2">
                                        "{example.voice}"
                                    </p>
                                    <p className="text-xs text-brand-400 font-medium">
                                        {example.result}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
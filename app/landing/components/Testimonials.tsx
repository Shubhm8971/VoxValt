// app/landing/components/Testimonials.tsx
'use client';

const TESTIMONIALS = [
    {
        name: 'Arjun Patel',
        role: 'Freelance Developer',
        avatar: '👨‍💻',
        text: "I used to forget client promises all the time. VoxValt catches every 'I'll do it by Friday' and reminds me before I drop the ball.",
        rating: 5,
    },
    {
        name: 'Priya Sharma',
        role: 'Product Manager',
        avatar: '👩‍💼',
        text: "The morning briefing is a game-changer. I start every day knowing exactly what I need to do and who I owe deliverables to.",
        rating: 5,
    },
    {
        name: 'Karthik Reddy',
        role: 'College Student',
        avatar: '🧑‍🎓',
        text: "I record ideas while walking to class. By the time I sit down, VoxValt has already organized them into tasks and reminders. Love it.",
        rating: 5,
    },
    {
        name: 'Sneha Iyer',
        role: 'Working Mom',
        avatar: '👩‍👧',
        text: "Between work calls, school pickups, and groceries — I was forgetting everything. VoxValt is like having a personal assistant in my pocket.",
        rating: 5,
    },
];

export default function Testimonials() {
    return (
        <section className="py-20 sm:py-28 relative">
            <div className="absolute inset-0 bg-mesh-gradient opacity-20" />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
                        Loved by users
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-vox-text mb-4">
                        People are remembering again
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="glass-card p-6 group hover:border-brand-500/20 transition-all duration-300">
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-3">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <span key={j} className="text-amber-400 text-sm">★</span>
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-sm text-vox-text-secondary leading-relaxed mb-4 italic">
                                "{t.text}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-vox-surface flex items-center justify-center text-xl">
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-vox-text">{t.name}</p>
                                    <p className="text-2xs text-vox-text-muted">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
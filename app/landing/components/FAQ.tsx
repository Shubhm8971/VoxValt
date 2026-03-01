// app/landing/components/FAQ.tsx
'use client';

import { useState } from 'react';

const FAQS = [
    {
        q: 'How does VoxValt work?',
        a: 'Record a voice note, and our AI (powered by Google Gemini) transcribes it, then extracts tasks, promises, reminders, and ideas. Everything is stored in a vector database for semantic search — meaning you can search your memories using natural language.',
    },
    {
        q: 'Is my data private?',
        a: 'Yes. Your voice recordings are processed and immediately discarded — we only store the transcription and extracted items. All data is encrypted and protected by Row Level Security, meaning only you can access your memories.',
    },
    {
        q: 'Does it work in Hindi / other Indian languages?',
        a: "Currently VoxValt works best in English (with Indian accent support). Hindi and other Indian language support is coming soon — it's our top priority for the next update.",
    },
    {
        q: 'Can I use it offline?',
        a: 'VoxValt is a Progressive Web App (PWA). You can install it on your phone and basic recording works offline. Recordings will be processed and synced when you reconnect to the internet.',
    },
    {
        q: 'What happens to the free plan after 7 days?',
        a: "Your older memories are archived after 7 days on the free plan. They're not deleted — if you upgrade to Pro, all your archived memories become accessible again with full search capabilities.",
    },
    {
        q: 'Can my family share a VoxValt account?',
        a: 'Yes! The Family plan supports up to 5 members. Each person has their own private memory vault, but you can share reminders and track promises made to each other.',
    },
    {
        q: 'How is this different from Apple/Google Notes?',
        a: "Notes apps require you to type and organize manually. VoxValt is voice-first — just speak naturally. AI automatically categorizes, tags, sets reminders, and tracks your commitments. It's a second brain, not a notepad.",
    },
    {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes, you can cancel anytime from your settings page. Your data remains accessible until the end of your billing period, and you can export everything as a JSON file before downgrading.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-20 sm:py-28">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
                        FAQ
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-vox-text mb-4">
                        Got questions?
                    </h2>
                </div>

                <div className="space-y-2">
                    {FAQS.map((faq, i) => (
                        <div
                            key={i}
                            className={`
                rounded-2xl overflow-hidden
                transition-all duration-300
                ${openIndex === i
                                    ? 'glass-card'
                                    : 'hover:bg-vox-surface/30'
                                }
              `}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <span className="text-sm font-medium text-vox-text pr-8">
                                    {faq.q}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-vox-text-muted flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div
                                className={`
                  overflow-hidden transition-all duration-300
                  ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
                            >
                                <p className="px-5 pb-5 text-sm text-vox-text-secondary leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="text-center mt-10">
                    <p className="text-sm text-vox-text-muted">
                        Still have questions?{' '}
                        <a href="mailto:support@voxvalt.com" className="text-brand-500 hover:underline font-medium">
                            Email us
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
}
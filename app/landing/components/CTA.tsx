// app/landing/components/CTA.tsx
'use client';

import Link from 'next/link';

export default function CTA() {
    return (
        <section className="py-20 sm:py-28 relative">
            <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-gradient shadow-glow mb-8">
                    <span className="text-4xl">🎙️</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-bold text-vox-text leading-tight mb-6">
                    Ready to never forget
                    <br />
                    <span className="gradient-text">anything again?</span>
                </h2>

                <p className="text-lg text-vox-text-secondary max-w-lg mx-auto mb-10">
                    Join 1,000+ professionals who've transformed their productivity. 
                    Free forever plan - no credit card required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/auth"
                        className="
              px-10 py-4 text-lg font-semibold text-white
              bg-brand-gradient rounded-2xl
              hover:opacity-90 active:scale-[0.98]
              transition-all duration-200
              shadow-glow hover:shadow-glow-lg
            "
                    >
                        Start Free — No Credit Card →
                    </Link>
                </div>

                <p className="mt-6 text-sm text-vox-text-muted">
                    Free forever plan available · Upgrade anytime · Cancel anytime
                </p>

                {/* Social proof */}
                <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t border-vox-border">
                    {[
                        { label: 'Voice notes processed', value: '50K+' },
                        { label: 'Promises tracked', value: '12K+' },
                        { label: 'Happy users', value: '2K+' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-vox-text">{stat.value}</p>
                            <p className="text-2xs text-vox-text-muted">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
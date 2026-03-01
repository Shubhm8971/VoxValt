// app/landing/components/Pricing.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

const PLANS = [
    {
        name: 'Free',
        price: { monthly: '₹0', yearly: '₹0' },
        period: 'forever',
        description: 'Perfect for trying out VoxValt',
        features: [
            '5 voice notes per day',
            '7-day memory retention',
            'Basic task extraction',
            'Web app access',
        ],
        limitations: ['No AI search', 'No morning briefings', 'No priority support'],
        cta: 'Start Free',
        href: '/auth',
        popular: false,
    },
    {
        name: 'Pro',
        price: { monthly: '₹149', yearly: '₹99' },
        period: { monthly: '/month', yearly: '/mo (billed yearly)' },
        yearlyTotal: '₹1,188/year',
        description: 'For people who never want to forget',
        features: [
            'Unlimited voice notes',
            'Forever memory archive',
            'AI-powered deep search',
            'Morning briefings',
            'Smart notifications',
            'People & tag tracking',
            'Export your data',
            'Priority support',
        ],
        limitations: [],
        cta: 'Go Pro',
        href: '/auth?plan=pro',
        popular: true,
    },
    {
        name: 'Family',
        price: { monthly: '₹299', yearly: '₹199' },
        period: { monthly: '/month', yearly: '/mo (billed yearly)' },
        yearlyTotal: '₹2,388/year',
        description: 'Shared memory for families & couples',
        features: [
            'Everything in Pro',
            'Up to 5 members',
            'Shared reminders',
            'Family promises tracking',
            'Shared morning briefings',
            'Calendar sync (coming soon)',
        ],
        limitations: [],
        cta: 'Start Family',
        href: '/auth?plan=family',
        popular: false,
    },
];

export default function Pricing() {
    const [annual, setAnnual] = useState(true);

    return (
        <section id="pricing" className="py-20 sm:py-28">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
                        Pricing
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-vox-text mb-4">
                        Simple, honest pricing
                    </h2>
                    <p className="text-lg text-vox-text-secondary max-w-xl mx-auto mb-8">
                        Start free. Upgrade when you're ready. Cancel anytime.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-vox-surface border border-vox-border">
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!annual ? 'bg-brand-500 text-white' : 'text-vox-text-secondary hover:text-vox-text'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${annual ? 'bg-brand-500 text-white' : 'text-vox-text-secondary hover:text-vox-text'}`}
                        >
                            Yearly
                            <span className={`text-2xs px-1.5 py-0.5 rounded-full ${annual ? 'bg-white/20 text-white' : 'bg-green-500/20 text-green-400'}`}>
                                Save 33%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {PLANS.map((plan, i) => (
                        <div
                            key={i}
                            className={`
                relative p-6 sm:p-8 rounded-3xl
                transition-all duration-300
                ${plan.popular
                                    ? 'bg-brand-500/10 border-2 border-brand-500/30 scale-[1.02] shadow-glow'
                                    : 'glass-card hover:border-vox-border-hover'
                                }
              `}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 rounded-full text-xs font-bold bg-brand-500 text-white shadow-glow-sm">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            {/* Plan info */}
                            <h3 className="text-lg font-bold text-vox-text">{plan.name}</h3>
                            <p className="text-xs text-vox-text-muted mt-1 mb-4">{plan.description}</p>

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-vox-text">
                                    {annual ? plan.price.yearly : plan.price.monthly}
                                </span>
                                <span className="text-sm text-vox-text-muted ml-1">
                                    {typeof plan.period === 'string'
                                        ? plan.period
                                        : annual
                                            ? plan.period.yearly
                                            : plan.period.monthly}
                                </span>
                                {annual && plan.yearlyTotal && (
                                    <p className="text-2xs text-vox-text-muted mt-1">{plan.yearlyTotal}</p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-2.5 mb-8">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-vox-text-secondary">
                                        <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                                        {feature}
                                    </li>
                                ))}
                                {plan.limitations.map((limitation, j) => (
                                    <li key={`l-${j}`} className="flex items-start gap-2 text-sm text-vox-text-muted line-through opacity-50">
                                        <span className="mt-0.5 flex-shrink-0">✗</span>
                                        {limitation}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link
                                href={plan.href}
                                className={`
                  block w-full py-3.5 rounded-xl text-center text-sm font-semibold
                  active:scale-[0.98] transition-all duration-200
                  ${plan.popular
                                        ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-glow-sm'
                                        : 'bg-vox-surface text-vox-text hover:bg-vox-surface-hover border border-vox-border'
                                    }
                `}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Trust */}
                <p className="text-center text-sm text-vox-text-muted mt-8">
                    💳 Payments powered by Razorpay · Cancel anytime · GST included
                </p>
            </div>
        </section>
    );
}
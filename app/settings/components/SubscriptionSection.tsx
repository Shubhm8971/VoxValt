// app/settings/components/SubscriptionSection.tsx
'use client';

import { useState } from 'react';
import type { SubscriptionData, ToastMessage } from '../SettingsPageClient';

interface SubscriptionSectionProps {
    subscription: SubscriptionData;
    onShowToast: (type: ToastMessage['type'], message: string) => void;
}

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '₹0',
        period: 'forever',
        features: [
            '5 voice notes per day',
            '7-day memory retention',
            'Basic reminders',
            'Web app access',
        ],
        limitations: [
            'No deep search',
            'No morning briefings',
            'No priority support',
        ],
    },
    {
        id: 'pro_monthly',
        name: 'Pro',
        price: '₹149',
        period: '/month',
        popular: true,
        features: [
            'Unlimited voice notes',
            'Forever memory archive',
            'AI-powered deep search',
            'Morning briefings',
            'Smart notifications',
            'Priority support',
            'Export your data',
        ],
        limitations: [],
    },
    {
        id: 'pro_yearly',
        name: 'Pro Annual',
        price: '₹1,199',
        period: '/year',
        savings: 'Save ₹589',
        features: [
            'Everything in Pro',
            '2 months free',
            'Early access to features',
        ],
        limitations: [],
    },
];

export default function SubscriptionSection({
    subscription,
    onShowToast,
}: SubscriptionSectionProps) {
    const [showPlans, setShowPlans] = useState(false);
    const [processing, setProcessing] = useState(false);

    const currentPlan = PLANS.find((p) => p.id === subscription.plan) || PLANS[0];
    const isPro = subscription.plan !== 'free' && subscription.status === 'active';
    const isExpired =
        subscription.expires_at && new Date(subscription.expires_at) < new Date();

    const handleUpgrade = async (planId: string) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            if (!res.ok) throw new Error('Failed to create order');

            const { orderId, amount } = await res.json();

            // Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount,
                currency: 'INR',
                name: 'VoxValt',
                description: `VoxValt ${planId.includes('yearly') ? 'Pro Annual' : 'Pro'} Plan`,
                order_id: orderId,
                handler: async (response: any) => {
                    // Verify payment
                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId,
                        }),
                    });

                    if (verifyRes.ok) {
                        onShowToast('success', '🎉 Upgraded to Pro! Enjoy unlimited memories.');
                        window.location.reload();
                    } else {
                        onShowToast('error', 'Payment verification failed. Contact support.');
                    }
                },
                prefill: {},
                theme: { color: '#667eea' },
            };

            if (typeof window !== 'undefined' && (window as any).Razorpay) {
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            } else {
                onShowToast('error', 'Payment system loading. Please try again.');
            }
        } catch (err: any) {
            onShowToast('error', err.message || 'Upgrade failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <section
            id="upgrade"
            className="glass-card p-4 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
        >
            <h3 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-4">
                💎 Subscription
            </h3>

            {/* Current Plan Badge */}
            <div
                className={`
        flex items-center justify-between p-3 rounded-xl mb-4
        ${isPro && !isExpired
                        ? 'bg-brand-500/10 border border-brand-500/20'
                        : isExpired
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-vox-surface border border-vox-border'
                    }
      `}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">
                        {isPro && !isExpired ? '👑' : isExpired ? '⚠️' : '🆓'}
                    </span>
                    <div>
                        <p className="font-semibold text-vox-text text-sm">
                            {currentPlan.name} Plan
                        </p>
                        {isPro && subscription.expires_at && (
                            <p className="text-2xs text-vox-text-muted">
                                {isExpired
                                    ? `Expired ${new Date(subscription.expires_at).toLocaleDateString('en-IN')}`
                                    : `Renews ${new Date(subscription.expires_at).toLocaleDateString('en-IN')}`}
                            </p>
                        )}
                        {!isPro && (
                            <p className="text-2xs text-vox-text-muted">
                                Limited to 5 voice notes/day
                            </p>
                        )}
                    </div>
                </div>

                {isPro && !isExpired && (
                    <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-brand-500/20 text-brand-400">
                        ACTIVE
                    </span>
                )}
            </div>

            {/* Upgrade / Show Plans */}
            {(!isPro || isExpired) && (
                <>
                    {!showPlans ? (
                        <button
                            onClick={() => setShowPlans(true)}
                            className="
                w-full py-3 rounded-xl text-center
                bg-brand-gradient text-white font-semibold
                hover:opacity-90 active:scale-[0.98]
                transition-all duration-200
                shadow-glow
              "
                        >
                            ⚡ Upgrade to Pro
                        </button>
                    ) : (
                        <div className="space-y-3 animate-fade-in-up">
                            {PLANS.filter((p) => p.id !== 'free').map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`
                    p-4 rounded-xl border transition-all duration-200
                    ${plan.popular
                                            ? 'bg-brand-500/10 border-brand-500/30'
                                            : 'bg-vox-surface/50 border-vox-border'
                                        }
                  `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <span className="font-semibold text-vox-text text-sm">
                                                {plan.name}
                                            </span>
                                            {plan.popular && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-2xs font-bold bg-brand-500 text-white">
                                                    POPULAR
                                                </span>
                                            )}
                                            {plan.savings && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-2xs font-bold bg-green-500/20 text-green-400">
                                                    {plan.savings}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-vox-text">
                                                {plan.price}
                                            </span>
                                            <span className="text-xs text-vox-text-muted">
                                                {plan.period}
                                            </span>
                                        </div>
                                    </div>

                                    <ul className="space-y-1 mb-3">
                                        {plan.features.map((feature, i) => (
                                            <li
                                                key={i}
                                                className="text-xs text-vox-text-secondary flex items-center gap-1.5"
                                            >
                                                <span className="text-green-400 text-sm">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        disabled={processing}
                                        className={`
                      w-full py-2.5 rounded-xl text-sm font-medium
                      active:scale-[0.98] transition-all duration-200
                      disabled:opacity-50
                      ${plan.popular
                                                ? 'bg-brand-500 text-white hover:bg-brand-600'
                                                : 'bg-vox-surface text-vox-text hover:bg-vox-surface-hover border border-vox-border'
                                            }
                    `}
                                    >
                                        {processing ? 'Processing...' : `Choose ${plan.name}`}
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => setShowPlans(false)}
                                className="w-full text-center text-xs text-vox-text-muted hover:text-vox-text-secondary py-2"
                            >
                                Maybe later
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Manage subscription (for pro users) */}
            {isPro && !isExpired && (
                <div className="flex gap-2">
                    <button
                        className="
              flex-1 py-2.5 rounded-xl text-center text-sm
              bg-vox-surface text-vox-text-secondary
              hover:bg-vox-surface-hover
              transition-all duration-200
            "
                        onClick={() => onShowToast('info', 'Contact support@voxvalt.com to manage your subscription')}
                    >
                        Manage Plan
                    </button>
                </div>
            )}
        </section>
    );
}
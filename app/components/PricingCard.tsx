'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/razorpay';
import RazorpayButton from './RazorpayButton';

interface PricingCardProps {
  plan: keyof typeof PLANS;
  currentPlan?: string;
  isAnnual?: boolean;
}

export default function PricingCard({ plan, currentPlan, isAnnual = false }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get the correct plan based on annual/monthly
  const getPlanData = () => {
    if (plan === 'FREE') return PLANS.FREE;
    if (plan === 'PREMIUM') return isAnnual ? PLANS.PREMIUM_YEARLY : PLANS.PREMIUM;
    if (plan === 'TEAM') return isAnnual ? PLANS.TEAM_YEARLY : PLANS.TEAM;
    return PLANS.FREE;
  };

  const planData = getPlanData();
  const isCurrentPlan = currentPlan === plan;
  const isPopular = plan === 'PREMIUM';

  const handlePaymentSuccess = () => {
    setLoading(false);
    setError(null);
    router.push('/success');
  };

  const handlePaymentError = (errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
  };

  return (
    <div className={`
      relative rounded-3xl p-8 border backdrop-blur-md transition-all duration-300 flex flex-col h-full
      ${isPopular ? 'border-brand-500/50 shadow-glow bg-vox-surface/80 scale-105 z-10' : 'border-vox-border bg-vox-surface/40 hover:bg-vox-surface/60'}
    `}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-brand-gradient text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-glow-sm">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-8 pb-8 border-b border-vox-border/50">
        <h3 className="text-xl font-bold text-vox-text mb-2 uppercase tracking-wide">{planData.name}</h3>
        <div className="flex items-baseline justify-center">
          <span className="text-4xl font-black text-vox-text tracking-tighter">
            {plan === 'FREE' ? 'Free' : `₹${planData.price / 100}`}
          </span>
          {plan !== 'FREE' && (
            <span className="text-vox-text-muted ml-2 text-sm font-medium">/{isAnnual ? 'year' : 'month'}</span>
          )}
        </div>
        {isAnnual && plan !== 'FREE' && (
          <p className="text-brand-400 text-xs font-bold mt-3 tracking-wider uppercase bg-brand-500/10 inline-block px-3 py-1 rounded-full border border-brand-500/20">
            Save 20%
          </p>
        )}
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {planData.features.map((feature, index) => (
          <li key={index} className="flex items-start text-sm">
            <svg className="w-5 h-5 text-brand-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-vox-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-xs font-medium">{error}</p>
        </div>
      )}

      {plan === 'FREE' ? (
        <button
          disabled={isCurrentPlan}
          className={`
            w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300
            ${isCurrentPlan
              ? 'bg-vox-surface border border-vox-border text-vox-text-muted cursor-not-allowed'
              : 'bg-white text-slate-900 hover:bg-slate-200 shadow-elevated hover:shadow-glow'
            }
          `}
        >
          {isCurrentPlan ? 'Current Plan' : 'Get Started'}
        </button>
      ) : (
        <RazorpayButton
          planId={planData.id}
          planName={planData.name}
          price={planData.price}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          disabled={isCurrentPlan}
          loading={loading}
        />
      )}
    </div>
  );
}

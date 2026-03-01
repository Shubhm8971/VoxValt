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
      relative rounded-2xl p-8 border-2 transition-all duration-300
      ${isPopular ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200'}
      ${isCurrentPlan ? 'bg-gray-50' : 'bg-white'}
    `}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{planData.name}</h3>
        <div className="flex items-baseline justify-center">
          <span className="text-4xl font-bold text-gray-900">
            {plan === 'FREE' ? 'Free' : `₹${planData.price / 100}`}
          </span>
          {plan !== 'FREE' && (
            <span className="text-gray-500 ml-2">/{isAnnual ? 'year' : 'month'}</span>
          )}
        </div>
        {isAnnual && plan !== 'FREE' && (
          <p className="text-green-600 text-sm mt-2">Save 20% vs monthly</p>
        )}
      </div>

      <ul className="space-y-4 mb-8">
        {planData.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {plan === 'FREE' ? (
        <button
          disabled={isCurrentPlan}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300
            ${isCurrentPlan
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
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

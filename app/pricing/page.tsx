'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { PLANS } from '@/lib/razorpay';
import PricingCard from '../components/PricingCard';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_id, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          if (subscription) {
            setCurrentPlan(subscription.plan_id);
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSubscription();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen-dvh bg-vox-bg bg-mesh-gradient flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-dvh bg-vox-bg bg-mesh-gradient relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-sticky bg-vox-bg/80 backdrop-blur-xl border-b border-vox-border pt-safe">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-vox-text-secondary hover:text-vox-text transition-colors"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-vox-surface transition-all active:scale-95">
              <ChevronLeft size={24} />
            </div>
            <span className="font-medium">Back to App</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Page Title */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-black text-vox-text mb-4 tracking-tighter">
            Unlock Your <span className="text-transparent bg-clip-text bg-brand-gradient">Memory</span>
          </h1>
          <p className="text-lg md:text-xl text-vox-text-secondary mb-10 max-w-2xl mx-auto">
            Start free, upgrade when you need more power and infinite recall.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-6 bg-vox-surface/50 backdrop-blur-sm border border-vox-border p-2 rounded-2xl w-fit mx-auto shadow-elevated">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!isAnnual
                  ? 'bg-vox-bg text-vox-text shadow-glow-sm'
                  : 'text-vox-text-muted hover:text-vox-text'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isAnnual
                  ? 'bg-vox-bg text-vox-text shadow-glow-sm'
                  : 'text-vox-text-muted hover:text-vox-text'
                }`}
            >
              Annual
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isAnnual ? 'bg-brand-500/20 text-brand-400' : 'bg-vox-surface border border-vox-border text-vox-text-muted'}`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 max-w-6xl mx-auto animate-fade-in-up delay-150">
          <PricingCard
            plan="FREE"
            currentPlan={currentPlan}
            isAnnual={isAnnual}
          />
          <PricingCard
            plan="PREMIUM"
            currentPlan={currentPlan}
            isAnnual={isAnnual}
          />
          <PricingCard
            plan="TEAM"
            currentPlan={currentPlan}
            isAnnual={isAnnual}
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto animate-fade-in-up delay-300 pb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-vox-text mb-12 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-vox-surface/50 backdrop-blur-sm border border-vox-border p-6 rounded-2xl hover:bg-vox-surface transition-colors">
              <h3 className="text-lg font-bold text-vox-text mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-vox-text-secondary">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-vox-surface/50 backdrop-blur-sm border border-vox-border p-6 rounded-2xl hover:bg-vox-surface transition-colors">
              <h3 className="text-lg font-bold text-vox-text mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-vox-text-secondary">
                Your data remains safe for 30 days after cancellation. You can reactivate your subscription anytime during this period.
              </p>
            </div>
            <div className="bg-vox-surface/50 backdrop-blur-sm border border-vox-border p-6 rounded-2xl hover:bg-vox-surface transition-colors">
              <h3 className="text-lg font-bold text-vox-text mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-vox-text-secondary">
                We offer a 30-day money-back guarantee for all paid plans. No questions asked.
              </p>
            </div>
            <div className="bg-vox-surface/50 backdrop-blur-sm border border-vox-border p-6 rounded-2xl hover:bg-vox-surface transition-colors">
              <h3 className="text-lg font-bold text-vox-text mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-vox-text-secondary">
                Yes. We use industry-standard encryption for payment processing and never store your credit card information directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

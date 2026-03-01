'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureName, FEATURES } from '@/lib/features';

interface PremiumFeatureProps {
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export default function PremiumFeature({
  feature,
  children,
  fallback = null,
  showUpgradePrompt = true,
}: PremiumFeatureProps) {
  const { hasFeature, loading, isPremium } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-vox-surface rounded-xl" />
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const featureInfo = FEATURES[feature];

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  return (
    <>
      {showUpgradePrompt && (
        <div 
          className="relative group cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          {/* Blurred/hidden content */}
          <div className="filter blur-md select-none pointer-events-none opacity-50">
            {children}
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-vox-bg/90 backdrop-blur-sm rounded-xl p-4 border border-vox-border shadow-elevated">
              <div className="flex items-center gap-2 text-brand-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">Premium Feature</span>
              </div>
              <p className="text-xs text-vox-text-muted mt-1 text-center">
                Click to upgrade
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-vox-bg rounded-2xl border border-vox-border shadow-elevated max-w-sm w-full p-6 animate-scale-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-vox-text-muted hover:text-vox-text"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-glow">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-bold text-vox-text mb-2">
                {featureInfo.tier === 'team' ? 'Team Feature' : 'Premium Feature'}
              </h3>
              
              <p className="text-sm text-vox-text-secondary mb-4">
                {featureInfo.name} is available on the {featureInfo.tier === 'team' ? 'Team' : 'Premium'} plan.
              </p>
              
              <div className="bg-vox-surface rounded-xl p-4 mb-6">
                <p className="text-xs text-vox-text-muted mb-2">What you'll get:</p>
                <ul className="text-sm text-vox-text space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-brand-400">✓</span>
                    {featureInfo.description}
                  </li>
                  {featureInfo.tier === 'premium' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-400">✓</span>
                        Unlimited voice recordings
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-400">✓</span>
                        Forever storage
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-400">✓</span>
                        Cloud sync
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <button
                onClick={handleUpgrade}
                className="w-full py-3 px-4 bg-brand-gradient rounded-xl font-medium text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
              >
                Upgrade to Premium
              </button>
              
              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-3 py-2 text-sm text-vox-text-muted hover:text-vox-text"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

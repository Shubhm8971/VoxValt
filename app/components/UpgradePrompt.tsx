'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureName, FEATURES, getRequiredPlanForFeature } from '@/lib/features';

interface UpgradePromptProps {
  feature?: FeatureName;
  title?: string;
  message?: string;
  ctaText?: string;
  variant?: 'banner' | 'inline' | 'modal';
  onDismiss?: () => void;
}

export default function UpgradePrompt({
  feature,
  title,
  message,
  ctaText = 'Upgrade Now',
  variant = 'banner',
  onDismiss,
}: UpgradePromptProps) {
  const router = useRouter();
  const { isPremium, isTeam } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // If user is already premium, don't show
  if (isPremium || isTeam || dismissed) {
    return null;
  }

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Determine content
  let contentTitle = title;
  let contentMessage = message;

  if (feature) {
    const featureInfo = FEATURES[feature];
    const requiredPlan = getRequiredPlanForFeature(feature);
    
    contentTitle = title || `Unlock ${featureInfo.name}`;
    contentMessage = message || `Upgrade to Premium to access ${featureInfo.name} and much more!`;
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-500/30 rounded-xl p-4 mb-4 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-vox-text flex items-center gap-2">
              <span className="text-lg">⭐</span>
              {contentTitle}
            </h4>
            <p className="text-xs text-vox-text-secondary mt-1">
              {contentMessage}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              className="px-3 py-1.5 bg-brand-gradient rounded-lg text-xs font-medium text-white shadow-glow-sm hover:shadow-glow transition-all active:scale-95"
            >
              {ctaText}
            </button>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1.5 text-vox-text-muted hover:text-vox-text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between gap-4 bg-vox-surface rounded-xl p-4 border border-vox-border">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-vox-text">{contentTitle}</h4>
          <p className="text-xs text-vox-text-secondary mt-0.5">{contentMessage}</p>
        </div>
        <button
          onClick={handleUpgrade}
          className="px-4 py-2 bg-brand-gradient rounded-lg text-sm font-medium text-white shadow-glow-sm hover:shadow-glow transition-all active:scale-95 whitespace-nowrap"
        >
          {ctaText}
        </button>
      </div>
    );
  }

  // Modal variant (default)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      <div className="relative bg-vox-bg rounded-2xl border border-vox-border shadow-elevated max-w-sm w-full p-6 animate-scale-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-vox-text-muted hover:text-vox-text"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-3xl">🚀</span>
          </div>
          
          <h3 className="text-xl font-bold text-vox-text mb-2">
            {contentTitle}
          </h3>
          
          <p className="text-sm text-vox-text-secondary mb-6">
            {contentMessage}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full py-3 px-4 bg-brand-gradient rounded-xl font-medium text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
            >
              {ctaText}
            </button>
            
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-sm text-vox-text-muted hover:text-vox-text"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Recording Limit Banner - shown when user is about to hit their limit
 */
export function RecordingLimitBanner({ 
  remaining, 
  onUpgrade 
}: { 
  remaining: number; 
  onUpgrade?: () => void;
}) {
  const router = useRouter();

  if (remaining === undefined || remaining > 2) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/pricing');
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-vox-text">
              {remaining === 0 ? 'Recording Limit Reached' : `Only ${remaining} recording${remaining === 1 ? '' : 's'} left`}
            </h4>
            <p className="text-xs text-vox-text-secondary">
              {remaining === 0 
                ? 'You\'ve used your 5 free recordings this month.' 
                : 'Upgrade to Premium for unlimited recordings!'}
            </p>
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          className="px-4 py-2 bg-brand-gradient rounded-lg text-sm font-medium text-white shadow-glow-sm hover:shadow-glow transition-all active:scale-95 whitespace-nowrap"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  PlanType, 
  FeatureName, 
  canAccessFeature, 
  getRequiredPlanForFeature,
  getPlanTier,
  FEATURES 
} from '@/lib/features';
import { getUserSubscriptionPlan, SubscriptionDetails } from '@/lib/subscription';

interface UseSubscriptionReturn {
  subscription: SubscriptionDetails | null;
  loading: boolean;
  hasFeature: (feature: FeatureName) => boolean;
  canAccess: (feature: FeatureName) => boolean;
  getUpgradeMessage: (feature: FeatureName) => string;
  refreshSubscription: () => Promise<void>;
  isFree: boolean;
  isPremium: boolean;
  isTeam: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const sub = await getUserSubscriptionPlan(user.id);
      setSubscription(sub);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const hasFeature = useCallback((feature: FeatureName): boolean => {
    if (!subscription) {
      // Not logged in - check if feature is available to free users
      return FEATURES[feature].tier === 'free';
    }
    return canAccessFeature(subscription.plan, feature);
  }, [subscription]);

  const canAccess = useCallback((feature: FeatureName): boolean => {
    return hasFeature(feature);
  }, [hasFeature]);

  const getUpgradeMessage = useCallback((feature: FeatureName): string => {
    const featureDef = FEATURES[feature];
    const requiredPlan = getRequiredPlanForFeature(feature);
    
    if (requiredPlan === 'team') {
      return `This feature requires a Team plan. Upgrade to access ${featureDef.name}!`;
    }
    
    return `Upgrade to Premium to access ${featureDef.name}!`;
  }, []);

  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    await fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    hasFeature,
    canAccess,
    getUpgradeMessage,
    refreshSubscription,
    isFree: !subscription?.isPremium,
    isPremium: subscription?.isPremium || false,
    isTeam: subscription?.tier === 'team',
  };
}

/**
 * Hook to check if user can record (with usage limits)
 */
export function useRecordingLimit() {
  const [canRecord, setCanRecord] = useState(true);
  const [remaining, setRemaining] = useState<number | undefined>();
  const [reason, setReason] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const checkLimit = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCanRecord(true);
        setLoading(false);
        return;
      }

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status, current_period_end')
        .eq('user_id', user.id)
        .single();

      // If premium or active, allow recording
      if (subscription?.status === 'active') {
        setCanRecord(true);
        setRemaining(undefined);
        setLoading(false);
        return;
      }

      // Check recording count for free users
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      const used = count || 0;
      const FREE_LIMIT = 5;
      const remainingRecordings = FREE_LIMIT - used;

      if (remainingRecordings <= 0) {
        setCanRecord(false);
        setRemaining(0);
        setReason(`You've used your ${FREE_LIMIT} free recordings this month. Upgrade to Premium for unlimited recordings!`);
      } else {
        setCanRecord(true);
        setRemaining(remainingRecordings);
      }
    } catch (error) {
      console.error('Error checking recording limit:', error);
      setCanRecord(true); // Allow on error
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  return { canRecord, remaining, reason, loading, refresh: checkLimit };
}

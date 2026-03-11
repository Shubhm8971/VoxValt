import { createAdminClient } from './supabase';
import { PlanType, getPlanTier, PLAN_LIMITS } from './features';

export interface SubscriptionDetails {
  isPremium: boolean;
  plan: PlanType;
  status: 'active' | 'canceled' | 'expired' | null;
  currentPeriodEnd: Date | null;
  isTrial: boolean;
  tier: 'free' | 'premium' | 'team';
}

export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionDetails> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan_id, status, current_period_end, razorpay_subscription_id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {
        isPremium: false,
        plan: 'free',
        status: null,
        currentPeriodEnd: null,
        isTrial: false,
        tier: 'free',
      };
    }

    const isActive = data.status === 'active';
    const isExpired = data.current_period_end && new Date(data.current_period_end) < new Date();
    const isPremium = isActive && !isExpired;

    // Determine plan from plan_id
    const plan = (data.plan_id as PlanType) || 'free';
    const tier = getPlanTier(plan);

    return {
      isPremium,
      plan,
      status: data.status,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
      isTrial: false,
      tier,
    };
  } catch (error) {
    console.error("Subscription check failed:", error);
    return {
      isPremium: false,
      plan: 'free',
      status: null,
      currentPeriodEnd: null,
      isTrial: false,
      tier: 'free',
    };
  }
}

/**
 * Get usage limits for a user's plan
 */
export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if user can record (based on plan limits)
 */
export async function canUserRecord(userId: string): Promise<{ canRecord: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscriptionPlan(userId);
  const limits = getPlanLimits(subscription.plan);

  // If unlimited, allow recording
  if (limits.recordingsPerMonth === -1) {
    return { canRecord: true };
  }

  // Get current month's recording count
  const supabase = createAdminClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('recordings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error checking recording count:', error);
    return { canRecord: true }; // Allow on error
  }

  const used = count || 0;
  const remaining = limits.recordingsPerMonth - used;

  if (remaining <= 0) {
    return {
      canRecord: false,
      reason: `You've reached your monthly limit of ${limits.recordingsPerMonth} recordings. Upgrade to Premium for unlimited recordings!`,
      remaining: 0
    };
  }

  return { canRecord: true, remaining };
}

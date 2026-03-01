/**
 * VOXVALT Feature Flags System
 * Defines all features and their plan requirements
 */

export type PlanType = 'free' | 'premium' | 'team' | 'premium_yearly' | 'team_yearly';

export type FeatureName =
  | 'unlimited_recordings'
  | 'unlimited_storage'
  | 'cloud_sync'
  | 'advanced_search'
  | 'calendar_integration'
  | 'team_features'
  | 'priority_support'
  | 'export_data'
  | 'custom_labels'
  | 'recording_playback'
  | 'voice_report'
  | 'morning_briefing'
  | 'analytics_dashboard';

// Feature definitions with plan requirements
export const FEATURES: Record<FeatureName, {
  name: string;
  description: string;
  requiredPlans: PlanType[];
  tier: 'free' | 'premium' | 'team';
}> = {
  unlimited_recordings: {
    name: 'Unlimited Voice Recordings',
    description: 'Record as many voice memos as you want',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  unlimited_storage: {
    name: 'Unlimited Storage',
    description: 'Keep your memories forever',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  cloud_sync: {
    name: 'Cloud Sync',
    description: 'Access your memories across all devices',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  advanced_search: {
    name: 'Advanced Search',
    description: 'Search through all your memories with powerful filters',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  calendar_integration: {
    name: 'Calendar Integration',
    description: 'Sync tasks to Google Calendar',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  team_features: {
    name: 'Team Collaboration',
    description: 'Share and collaborate with your team',
    requiredPlans: ['team', 'team_yearly'],
    tier: 'team',
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Get faster responses from our support team',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  export_data: {
    name: 'Data Export',
    description: 'Export your data in various formats',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  custom_labels: {
    name: 'Custom Labels',
    description: 'Create custom labels for organizing tasks',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  recording_playback: {
    name: 'Recording Playback',
    description: 'Play back your voice recordings',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  voice_report: {
    name: 'Voice Report',
    description: 'Get AI-powered insights from your recordings',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  morning_briefing: {
    name: 'Morning Briefing',
    description: 'Daily summary of your tasks and commitments',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
  analytics_dashboard: {
    name: 'Analytics Dashboard',
    description: 'View insights and statistics about your memory patterns',
    requiredPlans: ['premium', 'team', 'premium_yearly', 'team_yearly'],
    tier: 'premium',
  },
};

// Plan limits
export const PLAN_LIMITS = {
  free: {
    recordingsPerMonth: 5,
    storageDays: 7,
    maxRecordings: 5,
  },
  premium: {
    recordingsPerMonth: -1, // unlimited
    storageDays: -1, // forever
    maxRecordings: -1,
  },
  team: {
    recordingsPerMonth: -1,
    storageDays: -1,
    maxRecordings: -1,
    teamMembers: 10,
  },
  premium_yearly: {
    recordingsPerMonth: -1,
    storageDays: -1,
    maxRecordings: -1,
  },
  team_yearly: {
    recordingsPerMonth: -1,
    storageDays: -1,
    maxRecordings: -1,
    teamMembers: 10,
  },
} as const;

/**
 * Check if a user with a given plan can access a feature
 */
export function canAccessFeature(plan: PlanType | null, feature: FeatureName): boolean {
  if (plan === null || plan === 'free') {
    return !FEATURES[feature].requiredPlans.includes(plan as PlanType);
  }
  return FEATURES[feature].requiredPlans.includes(plan);
}

/**
 * Get the tier name for a plan
 */
export function getPlanTier(plan: PlanType | null): 'free' | 'premium' | 'team' {
  if (plan === null || plan === 'free') return 'free';
  if (plan === 'team' || plan === 'team_yearly') return 'team';
  return 'premium';
}

/**
 * Get required upgrade plan for a feature
 */
export function getRequiredPlanForFeature(feature: FeatureName): PlanType {
  const featureDef = FEATURES[feature];
  if (featureDef.tier === 'free') return 'free';
  if (featureDef.tier === 'team') return 'team';
  return 'premium';
}

// Subscription tier check utility
// Used to gate features based on subscription tier

export type SubscriptionInfo = {
  active: boolean;
  tier: string;
  status?: string;
  expiresAt?: string;
  maxStudents?: number;
  maxTeachers?: number;
  isHomeschool?: boolean;
};

// Feature access by tier
const TIER_FEATURES: Record<string, string[]> = {
  FREE: ['ai-tutor-limited', 'adaptive-learning', 'parent-dashboard', 'assignments'],
  STARTER: ['ai-tutor', 'ai-grader', 'adaptive-learning', 'file-uploads', 'parent-dashboard', 'assignments', 'study-planner'],
  CUSTOM: ['ai-tutor', 'ai-grader', 'adaptive-learning', 'file-uploads', 'parent-dashboard', 'assignments', 'study-planner', 'priority-support'],
  STANDARD: ['ai-tutor', 'ai-grader', 'adaptive-learning', 'file-uploads', 'parent-dashboard', 'assignments', 'study-planner', 'analytics', 'lms-integration', 'multi-school'],
  PREMIUM: ['ai-tutor', 'ai-grader', 'adaptive-learning', 'file-uploads', 'parent-dashboard', 'assignments', 'study-planner', 'analytics', 'lms-integration', 'multi-school', 'custom-branding', 'api-access', 'bulk-import'],
  ENTERPRISE: ['ai-tutor', 'ai-grader', 'adaptive-learning', 'file-uploads', 'parent-dashboard', 'assignments', 'study-planner', 'analytics', 'lms-integration', 'multi-school', 'custom-branding', 'api-access', 'bulk-import', 'sso', 'custom-ai', 'sla'],
};

export function hasFeatureAccess(tier: string, feature: string): boolean {
  const features = TIER_FEATURES[tier] || TIER_FEATURES['FREE'];
  return features.includes(feature);
}

export function getAvailableFeatures(tier: string): string[] {
  return TIER_FEATURES[tier] || TIER_FEATURES['FREE'];
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case 'FREE': return 'Free';
    case 'STARTER': return 'Starter';
    case 'CUSTOM': return 'Custom';
    case 'STANDARD': return 'Standard';
    case 'PREMIUM': return 'Premium';
    case 'ENTERPRISE': return 'Enterprise';
    default: return tier;
  }
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'FREE': return 'bg-gray-100 text-gray-700';
    case 'STARTER': return 'bg-blue-100 text-blue-700';
    case 'CUSTOM': return 'bg-teal-100 text-teal-700';
    case 'STANDARD': return 'bg-emerald-100 text-emerald-700';
    case 'PREMIUM': return 'bg-purple-100 text-purple-700';
    case 'ENTERPRISE': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

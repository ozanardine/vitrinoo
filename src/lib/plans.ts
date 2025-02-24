import { PLAN_LIMITS } from './store';

export type PlanType = 'free' | 'basic' | 'plus';

export interface PlanLimit {
  products: number;
  categories: number;
  images_per_product: number;
  name: string;
  price: number;
  metadata: {
    plan_type: PlanType;
    imgur_enabled?: boolean;
  };
}

export interface PlanLimits {
  free: PlanLimit;
  basic: PlanLimit;
  plus: PlanLimit;
}

// Type guard to check if a string is a valid plan type
export function isPlanType(value: string): value is PlanType {
  return ['free', 'basic', 'plus'].includes(value as PlanType);
}

// Get plan limits for a specific plan type
export function getPlanLimits(planType: PlanType): PlanLimit {
  return PLAN_LIMITS[planType];
}

// Check if a specific limit has been reached
export function hasReachedLimit(
  planType: PlanType,
  limitType: keyof Pick<PlanLimit, 'products' | 'categories' | 'images_per_product'>,
  currentValue: number
): boolean {
  const limits = getPlanLimits(planType);
  return currentValue >= limits[limitType];
}

// Get remaining quota for a specific limit
export function getRemainingQuota(
  planType: PlanType,
  limitType: keyof Pick<PlanLimit, 'products' | 'categories' | 'images_per_product'>,
  currentValue: number
): number {
  const limits = getPlanLimits(planType);
  return Math.max(0, limits[limitType] - currentValue);
}

// Get usage percentage for a specific limit
export function getUsagePercentage(
  planType: PlanType,
  limitType: keyof Pick<PlanLimit, 'products' | 'categories' | 'images_per_product'>,
  currentValue: number
): number {
  const limits = getPlanLimits(planType);
  return Math.min(100, (currentValue / limits[limitType]) * 100);
}

// Check if a plan has a specific feature
export function hasPlanFeature(planType: PlanType, feature: string): boolean {
  switch (feature) {
    case 'imgur_upload':
      return !!PLAN_LIMITS[planType].metadata.imgur_enabled;
    case 'priority_support':
      return ['basic', 'plus'].includes(planType);
    case 'erp_integration':
      return planType === 'plus';
    case 'ai_descriptions':
      return planType === 'plus';
    default:
      return false;
  }
}
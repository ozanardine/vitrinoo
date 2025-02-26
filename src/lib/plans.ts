import { PLAN_LIMITS } from './store';

// Alterando de 'free' | 'basic' | 'plus' para 'starter' | 'pro' | 'enterprise'
export type PlanType = 'starter' | 'pro' | 'enterprise';

export interface PlanLimit {
  products: number;
  categories: number;
  images_per_product: number;
  name: string;
  price: number;
  metadata: {
    plan_type: PlanType;
    imgur_enabled?: boolean;
    priority_support?: boolean;
    erp_integration?: boolean;
    ai_features_enabled?: boolean;
    custom_domain_enabled?: boolean;
    api_access?: boolean;
    analytics_enabled?: boolean;
  };
}

export interface PlanLimits {
  starter: PlanLimit;
  pro: PlanLimit;
  enterprise: PlanLimit;
}

// Type guard para verificar se uma string é um tipo de plano válido
export function isPlanType(value: string): value is PlanType {
  return ['starter', 'pro', 'enterprise'].includes(value as PlanType);
}

// Obter limites do plano para um tipo específico
export function getPlanLimits(planType: PlanType): PlanLimit {
  return PLAN_LIMITS[planType];
}

// Verificar se um limite específico foi atingido
export function hasReachedLimit(
  planType: PlanType,
  limitType: keyof Pick<PlanLimit, 'products' | 'categories' | 'images_per_product'>,
  currentValue: number
): boolean {
  const limits = getPlanLimits(planType);
  return currentValue >= limits[limitType];
}

// Obter cota restante para um limite específico
export function getRemainingQuota(
  planType: PlanType,
  limitType: keyof Pick<PlanLimit, 'products' | 'categories' | 'images_per_product'>,
  currentValue: number
): number {
  const limits = getPlanLimits(planType);
  return Math.max(0, limits[limitType] - currentValue);
}

// Obter porcentagem de uso para um limite específico
export function getUsagePercentage(
  planType: PlanType,
  limitType: keyof Pick<PlanLimit, 'products' | 'categories' | 'images_per_product'>,
  currentValue: number
): number {
  const limits = getPlanLimits(planType);
  return Math.min(100, (currentValue / limits[limitType]) * 100);
}

// Verificar se um plano tem um recurso específico
export function hasPlanFeature(planType: PlanType, feature: string): boolean {
  switch (feature) {
    case 'imgur_upload':
      return !!PLAN_LIMITS[planType].metadata.imgur_enabled;
    case 'priority_support':
      return !!PLAN_LIMITS[planType].metadata.priority_support;
    case 'erp_integration':
      return !!PLAN_LIMITS[planType].metadata.erp_integration;
    case 'ai_descriptions':
      return !!PLAN_LIMITS[planType].metadata.ai_features_enabled;
    case 'custom_domain':
      return !!PLAN_LIMITS[planType].metadata.custom_domain_enabled;
    case 'api_access':
      return !!PLAN_LIMITS[planType].metadata.api_access;
    case 'analytics':
      return !!PLAN_LIMITS[planType].metadata.analytics_enabled;
    default:
      return false;
  }
}
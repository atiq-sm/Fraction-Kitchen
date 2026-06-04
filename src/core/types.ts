import { Fraction } from './Fraction';

export interface Ingredient {
  id: string;
  name: string;
  colorHex: string;
}

export interface ScoopSize {
  fraction: Fraction;
  label: string;
}

export interface OrderRequirement {
  ingredientId: string;
  target: Fraction;
}

export interface Order {
  id: string;
  tier: number;
  requirements: OrderRequirement[];
  patienceMs: number;
}

export interface Pour {
  ingredientId: string;
  amount: Fraction;
}

export type GlassState = Pour[];

export interface TierConfig {
  tier: number;
  allowedDenominators: number[];
  ingredientCount: [number, number];
  scoopsPerIngredient: [number, number];
  allowMixedNumbers: boolean;
  maxTargetValue: number;
  patienceMs: number;
}

export interface SkillConfig {
  meta: {
    title: string;
    theme: string;
    sessionMode: 'endless' | 'fixedCount' | 'timed';
    lives: number;
    customerCount?: number;
    shiftMs?: number;
  };
  glass: { capacityCups: number };
  ingredients: Ingredient[];
  difficulty: {
    startTier: number;
    minTier: number;
    maxTier: number;
    windowSize: number;
    promoteAccuracy: number;
    demoteAccuracy: number;
    fastTimeMs: number;
  };
  tiers: TierConfig[];
}

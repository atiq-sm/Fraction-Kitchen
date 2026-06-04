import { Fraction } from './Fraction';
import type { GlassState, Order } from './types';

export interface ServeResult {
  success: boolean;
  reason: 'exact' | 'over' | 'under' | 'wrong-ingredient' | 'extra-ingredient';
}

export function totalFill(glass: GlassState): Fraction {
  let sum = Fraction.zero();
  for (const pour of glass) {
    sum = sum.add(pour.amount);
  }
  return sum;
}

export function perIngredient(glass: GlassState): Map<string, Fraction> {
  const map = new Map<string, Fraction>();
  for (const pour of glass) {
    const current = map.get(pour.ingredientId) ?? Fraction.zero();
    map.set(pour.ingredientId, current.add(pour.amount));
  }
  return map;
}

export function validateServe(glass: GlassState, order: Order): ServeResult {
  const poured = perIngredient(glass);
  const requiredIds = new Set(order.requirements.map((r) => r.ingredientId));
  const pouredIds = new Set(poured.keys());

  for (const id of pouredIds) {
    if (!requiredIds.has(id)) {
      return { success: false, reason: 'extra-ingredient' };
    }
  }

  for (const req of order.requirements) {
    const amount = poured.get(req.ingredientId);
    if (!amount) {
      return { success: false, reason: 'wrong-ingredient' };
    }
    if (amount.equals(req.target)) continue;

    const cmp = amount.compare(req.target);
    if (cmp > 0) return { success: false, reason: 'over' };
    return { success: false, reason: 'under' };
  }

  return { success: true, reason: 'exact' };
}

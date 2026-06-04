import { describe, it, expect } from 'vitest';
import { OrderGenerator } from '../src/core/OrderGenerator';
import { Fraction } from '../src/core/Fraction';
import { RNG } from '../src/core/RNG';
import type { Ingredient, TierConfig } from '../src/core/types';

const ingredients: Ingredient[] = [
  { id: 'strawberry', name: 'Strawberry', colorHex: '#FF4D6D' },
  { id: 'banana', name: 'Banana', colorHex: '#FFCE45' },
  { id: 'blueberry', name: 'Blueberry', colorHex: '#5B6CFF' },
  { id: 'lime', name: 'Lime', colorHex: '#3CB371' },
];

const tiers: TierConfig[] = [
  { tier: 1, allowedDenominators: [2, 3, 4], ingredientCount: [1, 1], scoopsPerIngredient: [1, 3], allowMixedNumbers: false, maxTargetValue: 1.0, patienceMs: 14000 },
  { tier: 2, allowedDenominators: [2, 3, 4, 6], ingredientCount: [1, 1], scoopsPerIngredient: [1, 4], allowMixedNumbers: false, maxTargetValue: 1.0, patienceMs: 12000 },
  { tier: 3, allowedDenominators: [2, 3, 4, 6], ingredientCount: [1, 1], scoopsPerIngredient: [2, 4], allowMixedNumbers: false, maxTargetValue: 1.0, patienceMs: 11000 },
  { tier: 4, allowedDenominators: [2, 3, 4, 6, 8], ingredientCount: [1, 2], scoopsPerIngredient: [2, 5], allowMixedNumbers: true, maxTargetValue: 1.5, patienceMs: 10000 },
  { tier: 5, allowedDenominators: [2, 3, 4, 6, 8], ingredientCount: [2, 3], scoopsPerIngredient: [2, 6], allowMixedNumbers: true, maxTargetValue: 1.5, patienceMs: 9000 },
];

function isSolvable(target: Fraction, allowedDenominators: number[]): boolean {
  // BFS to check if target is reachable via unit fractions from allowed denominators
  const unitFractions = allowedDenominators.map((d) => new Fraction(1, d));
  const queue: Fraction[] = [Fraction.zero()];
  const visited = new Set<string>();
  visited.add('0/1');

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const uf of unitFractions) {
      const next = current.add(uf);
      const key = next.toString();
      if (next.equals(target)) return true;
      if (next.compare(target) > 0) continue;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return false;
}

describe('OrderGenerator', () => {
  describe('solvability invariant (property test)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const tierCfg of tiers) {
        it(`seed=${seed} tier=${tierCfg.tier}: order is valid and solvable`, () => {
          const rng = new RNG(seed);
          const gen = new OrderGenerator(ingredients, tiers, rng);
          const order = gen.generate(tierCfg.tier);

          expect(order.tier).toBe(tierCfg.tier);
          expect(order.requirements.length).toBeGreaterThanOrEqual(tierCfg.ingredientCount[0]);
          expect(order.requirements.length).toBeLessThanOrEqual(
            Math.min(tierCfg.ingredientCount[1], ingredients.length),
          );

          const ids = order.requirements.map((r) => r.ingredientId);
          expect(new Set(ids).size).toBe(ids.length);

          for (const req of order.requirements) {
            expect(req.target.value()).toBeGreaterThan(0);
            expect(req.target.value()).toBeLessThanOrEqual(tierCfg.maxTargetValue + 0.001);

            if (!tierCfg.allowMixedNumbers) {
              expect(req.target.value()).toBeLessThanOrEqual(1.001);
            }

            expect(isSolvable(req.target, tierCfg.allowedDenominators)).toBe(true);
          }
        });
      }
    }
  });

  it('deterministic: same seed produces identical orders', () => {
    const gen1 = new OrderGenerator(ingredients, tiers, new RNG(42));
    const gen2 = new OrderGenerator(ingredients, tiers, new RNG(42));

    for (let i = 0; i < 10; i++) {
      const o1 = gen1.generate(1);
      const o2 = gen2.generate(1);
      expect(o1.requirements.length).toBe(o2.requirements.length);
      for (let j = 0; j < o1.requirements.length; j++) {
        expect(o1.requirements[j].ingredientId).toBe(o2.requirements[j].ingredientId);
        expect(o1.requirements[j].target.equals(o2.requirements[j].target)).toBe(true);
      }
    }
  });
});

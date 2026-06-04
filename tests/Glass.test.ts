import { describe, it, expect } from 'vitest';
import { Fraction } from '../src/core/Fraction';
import { totalFill, perIngredient, validateServe } from '../src/core/Glass';
import type { GlassState, Order } from '../src/core/types';

function makeOrder(reqs: Array<{ id: string; num: number; den: number }>): Order {
  return {
    id: 'test-order',
    tier: 1,
    requirements: reqs.map((r) => ({
      ingredientId: r.id,
      target: new Fraction(r.num, r.den),
    })),
    patienceMs: 10000,
  };
}

describe('Glass helpers', () => {
  describe('totalFill', () => {
    it('sums multiple pours', () => {
      const glass: GlassState = [
        { ingredientId: 'a', amount: new Fraction(1, 4) },
        { ingredientId: 'a', amount: new Fraction(1, 4) },
        { ingredientId: 'b', amount: new Fraction(1, 3) },
      ];
      const total = totalFill(glass);
      // 1/4 + 1/4 + 1/3 = 1/2 + 1/3 = 5/6
      expect(total.equals(new Fraction(5, 6))).toBe(true);
    });

    it('empty glass is zero', () => {
      expect(totalFill([]).isZero()).toBe(true);
    });
  });

  describe('perIngredient', () => {
    it('groups by ingredient', () => {
      const glass: GlassState = [
        { ingredientId: 'strawberry', amount: new Fraction(1, 4) },
        { ingredientId: 'banana', amount: new Fraction(1, 3) },
        { ingredientId: 'strawberry', amount: new Fraction(1, 4) },
      ];
      const map = perIngredient(glass);
      expect(map.get('strawberry')!.equals(new Fraction(1, 2))).toBe(true);
      expect(map.get('banana')!.equals(new Fraction(1, 3))).toBe(true);
    });
  });

  describe('validateServe', () => {
    it('exact match passes', () => {
      const order = makeOrder([{ id: 'strawberry', num: 3, den: 4 }]);
      const glass: GlassState = [
        { ingredientId: 'strawberry', amount: new Fraction(1, 2) },
        { ingredientId: 'strawberry', amount: new Fraction(1, 4) },
      ];
      const result = validateServe(glass, order);
      expect(result.success).toBe(true);
      expect(result.reason).toBe('exact');
    });

    it('equivalent combination passes (1/4+1/4 for 1/2 target)', () => {
      const order = makeOrder([{ id: 'strawberry', num: 1, den: 2 }]);
      const glass: GlassState = [
        { ingredientId: 'strawberry', amount: new Fraction(1, 4) },
        { ingredientId: 'strawberry', amount: new Fraction(1, 4) },
      ];
      expect(validateServe(glass, order).success).toBe(true);
    });

    it('over returns over', () => {
      const order = makeOrder([{ id: 'a', num: 1, den: 2 }]);
      const glass: GlassState = [{ ingredientId: 'a', amount: new Fraction(3, 4) }];
      const r = validateServe(glass, order);
      expect(r.success).toBe(false);
      expect(r.reason).toBe('over');
    });

    it('under returns under', () => {
      const order = makeOrder([{ id: 'a', num: 3, den: 4 }]);
      const glass: GlassState = [{ ingredientId: 'a', amount: new Fraction(1, 4) }];
      const r = validateServe(glass, order);
      expect(r.success).toBe(false);
      expect(r.reason).toBe('under');
    });

    it('extra ingredient detected', () => {
      const order = makeOrder([{ id: 'a', num: 1, den: 2 }]);
      const glass: GlassState = [
        { ingredientId: 'a', amount: new Fraction(1, 2) },
        { ingredientId: 'b', amount: new Fraction(1, 4) },
      ];
      const r = validateServe(glass, order);
      expect(r.success).toBe(false);
      expect(r.reason).toBe('extra-ingredient');
    });

    it('missing ingredient detected', () => {
      const order = makeOrder([
        { id: 'a', num: 1, den: 2 },
        { id: 'b', num: 1, den: 4 },
      ]);
      const glass: GlassState = [{ ingredientId: 'a', amount: new Fraction(1, 2) }];
      const r = validateServe(glass, order);
      expect(r.success).toBe(false);
      expect(r.reason).toBe('wrong-ingredient');
    });

    it('multi-ingredient exact match', () => {
      const order = makeOrder([
        { id: 'strawberry', num: 1, den: 2 },
        { id: 'banana', num: 1, den: 4 },
      ]);
      const glass: GlassState = [
        { ingredientId: 'strawberry', amount: new Fraction(1, 4) },
        { ingredientId: 'strawberry', amount: new Fraction(1, 4) },
        { ingredientId: 'banana', amount: new Fraction(1, 4) },
      ];
      expect(validateServe(glass, order).success).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { Fraction } from '../src/core/Fraction';

describe('Fraction', () => {
  describe('construction & reduction', () => {
    it('reduces 2/4 to 1/2', () => {
      const f = new Fraction(2, 4);
      expect(f.num).toBe(1);
      expect(f.den).toBe(2);
    });

    it('reduces 6/8 to 3/4', () => {
      const f = new Fraction(6, 8);
      expect(f.toString()).toBe('3/4');
    });

    it('stores 0/5 as 0/1', () => {
      const f = new Fraction(0, 5);
      expect(f.num).toBe(0);
      expect(f.den).toBe(1);
    });

    it('throws on denominator 0', () => {
      expect(() => new Fraction(1, 0)).toThrow();
    });

    it('normalizes -1/2 sign to numerator', () => {
      const f = new Fraction(-1, 2);
      expect(f.num).toBe(-1);
      expect(f.den).toBe(2);
    });

    it('normalizes 1/-2 sign to numerator', () => {
      const f = new Fraction(1, -2);
      expect(f.num).toBe(-1);
      expect(f.den).toBe(2);
    });

    it('normalizes -1/-2 to positive', () => {
      const f = new Fraction(-1, -2);
      expect(f.num).toBe(1);
      expect(f.den).toBe(2);
    });
  });

  describe('equality (equivalence engine)', () => {
    it('1/2 equals 2/4', () => {
      expect(new Fraction(1, 2).equals(new Fraction(2, 4))).toBe(true);
    });

    it('1/2 equals 3/6', () => {
      expect(new Fraction(1, 2).equals(new Fraction(3, 6))).toBe(true);
    });

    it('1/2 does not equal 1/3', () => {
      expect(new Fraction(1, 2).equals(new Fraction(1, 3))).toBe(false);
    });

    it('equivalence via addition: 1/4 + 1/4 equals 1/2', () => {
      const sum = new Fraction(1, 4).add(new Fraction(1, 4));
      expect(sum.equals(new Fraction(1, 2))).toBe(true);
    });
  });

  describe('arithmetic', () => {
    it('adds 1/4 + 1/4 = 1/2', () => {
      const r = new Fraction(1, 4).add(new Fraction(1, 4));
      expect(r.toString()).toBe('1/2');
    });

    it('adds 1/3 + 1/6 = 1/2', () => {
      const r = new Fraction(1, 3).add(new Fraction(1, 6));
      expect(r.toString()).toBe('1/2');
    });

    it('adds 1/2 + 1/3 = 5/6', () => {
      const r = new Fraction(1, 2).add(new Fraction(1, 3));
      expect(r.toString()).toBe('5/6');
    });

    it('subtracts 3/4 - 1/4 = 1/2', () => {
      const r = new Fraction(3, 4).subtract(new Fraction(1, 4));
      expect(r.toString()).toBe('1/2');
    });

    it('subtracts to negative', () => {
      const r = new Fraction(1, 4).subtract(new Fraction(1, 2));
      expect(r.num).toBe(-1);
      expect(r.den).toBe(4);
    });
  });

  describe('comparison', () => {
    it('1/2 > 1/3', () => {
      expect(new Fraction(1, 2).compare(new Fraction(1, 3))).toBe(1);
    });

    it('1/4 < 1/2', () => {
      expect(new Fraction(1, 4).compare(new Fraction(1, 2))).toBe(-1);
    });

    it('2/4 == 1/2', () => {
      expect(new Fraction(2, 4).compare(new Fraction(1, 2))).toBe(0);
    });
  });

  describe('display', () => {
    it('toString: 3/4', () => {
      expect(new Fraction(3, 4).toString()).toBe('3/4');
    });

    it('toString: whole number', () => {
      expect(new Fraction(4, 2).toString()).toBe('2');
    });

    it('toMixedString: 5/4 -> "1 1/4"', () => {
      expect(new Fraction(5, 4).toMixedString()).toBe('1 1/4');
    });

    it('toMixedString: 4/2 -> "2"', () => {
      expect(new Fraction(4, 2).toMixedString()).toBe('2');
    });

    it('toMixedString: 3/4 -> "3/4"', () => {
      expect(new Fraction(3, 4).toMixedString()).toBe('3/4');
    });

    it('toMixedString: 7/3 -> "2 1/3"', () => {
      expect(new Fraction(7, 3).toMixedString()).toBe('2 1/3');
    });
  });

  describe('predicates', () => {
    it('isWhole for 4/2', () => {
      expect(new Fraction(4, 2).isWhole()).toBe(true);
    });

    it('not isWhole for 3/4', () => {
      expect(new Fraction(3, 4).isWhole()).toBe(false);
    });

    it('isZero for 0/5', () => {
      expect(new Fraction(0, 5).isZero()).toBe(true);
    });

    it('not isZero for 1/2', () => {
      expect(new Fraction(1, 2).isZero()).toBe(false);
    });
  });

  describe('value', () => {
    it('3/4 = 0.75', () => {
      expect(new Fraction(3, 4).value()).toBe(0.75);
    });

    it('1/3 ≈ 0.333', () => {
      expect(new Fraction(1, 3).value()).toBeCloseTo(0.3333, 3);
    });
  });

  describe('static factories', () => {
    it('zero() is 0/1', () => {
      const z = Fraction.zero();
      expect(z.num).toBe(0);
      expect(z.den).toBe(1);
    });

    it('fromInt(3) is 3/1', () => {
      const f = Fraction.fromInt(3);
      expect(f.num).toBe(3);
      expect(f.den).toBe(1);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/RNG';

describe('RNG', () => {
  it('is deterministic with same seed', () => {
    const a = new RNG(42);
    const b = new RNG(42);
    for (let i = 0; i < 20; i++) {
      expect(a.float()).toBe(b.float());
    }
  });

  it('different seeds give different sequences', () => {
    const a = new RNG(1);
    const b = new RNG(2);
    let same = 0;
    for (let i = 0; i < 20; i++) {
      if (a.float() === b.float()) same++;
    }
    expect(same).toBeLessThan(5);
  });

  it('int stays within bounds', () => {
    const rng = new RNG(123);
    for (let i = 0; i < 200; i++) {
      const v = rng.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it('pick returns element from array', () => {
    const rng = new RNG(7);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  it('pickDistinct returns correct count with no duplicates', () => {
    const rng = new RNG(99);
    const arr = [1, 2, 3, 4, 5];
    const picked = rng.pickDistinct(arr, 3);
    expect(picked.length).toBe(3);
    expect(new Set(picked).size).toBe(3);
    for (const v of picked) {
      expect(arr).toContain(v);
    }
  });
});

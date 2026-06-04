import { describe, it, expect } from 'vitest';
import { DifficultyManager } from '../src/core/DifficultyManager';

describe('DifficultyManager', () => {
  it('starts at configured tier', () => {
    const dm = new DifficultyManager({ startTier: 3 });
    expect(dm.currentTier).toBe(3);
  });

  it('promotes after windowSize correct+fast samples', () => {
    const dm = new DifficultyManager({ startTier: 1, windowSize: 5 });
    for (let i = 0; i < 5; i++) {
      dm.record({ correct: true, timeMs: 3000 });
    }
    expect(dm.currentTier).toBe(2);
  });

  it('does not promote with slow times', () => {
    const dm = new DifficultyManager({ startTier: 1, windowSize: 5, fastTimeMs: 6000 });
    for (let i = 0; i < 5; i++) {
      dm.record({ correct: true, timeMs: 8000 });
    }
    expect(dm.currentTier).toBe(1);
  });

  it('demotes after windowSize incorrect samples', () => {
    const dm = new DifficultyManager({ startTier: 3, windowSize: 5 });
    for (let i = 0; i < 5; i++) {
      dm.record({ correct: false, timeMs: 5000 });
    }
    expect(dm.currentTier).toBe(2);
  });

  it('sets hint flag on demote', () => {
    const dm = new DifficultyManager({ startTier: 2, windowSize: 5 });
    for (let i = 0; i < 5; i++) {
      dm.record({ correct: false, timeMs: 5000 });
    }
    expect(dm.shouldHint()).toBe(true);
    expect(dm.shouldHint()).toBe(false);
  });

  it('never exceeds maxTier', () => {
    const dm = new DifficultyManager({ startTier: 5, maxTier: 5, windowSize: 5 });
    for (let i = 0; i < 5; i++) {
      dm.record({ correct: true, timeMs: 3000 });
    }
    expect(dm.currentTier).toBe(5);
  });

  it('never goes below minTier', () => {
    const dm = new DifficultyManager({ startTier: 1, minTier: 1, windowSize: 5 });
    for (let i = 0; i < 5; i++) {
      dm.record({ correct: false, timeMs: 5000 });
    }
    expect(dm.currentTier).toBe(1);
  });

  it('window clears after tier change — needs full window again', () => {
    const dm = new DifficultyManager({ startTier: 1, windowSize: 5 });
    // Promote to tier 2
    for (let i = 0; i < 5; i++) {
      dm.record({ correct: true, timeMs: 3000 });
    }
    expect(dm.currentTier).toBe(2);
    // 3 more correct — not enough for another promote
    for (let i = 0; i < 3; i++) {
      dm.record({ correct: true, timeMs: 3000 });
    }
    expect(dm.currentTier).toBe(2);
    // 2 more to fill new window
    for (let i = 0; i < 2; i++) {
      dm.record({ correct: true, timeMs: 3000 });
    }
    expect(dm.currentTier).toBe(3);
  });
});

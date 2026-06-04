import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../src/core/ScoreManager';

const mockStorage: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
});

describe('ScoreManager', () => {
  let sm: ScoreManager;

  beforeEach(() => {
    for (const key of Object.keys(mockStorage)) delete mockStorage[key];
    sm = new ScoreManager();
  });

  it('starts at zero', () => {
    expect(sm.score).toBe(0);
    expect(sm.combo).toBe(0);
    expect(sm.coins).toBe(0);
  });

  it('increments combo on success', () => {
    sm.serveSuccess(1, 7000, 14000);
    expect(sm.combo).toBe(1);
    sm.serveSuccess(1, 7000, 14000);
    expect(sm.combo).toBe(2);
  });

  it('resets combo on fail', () => {
    sm.serveSuccess(1, 7000, 14000);
    sm.serveSuccess(1, 7000, 14000);
    sm.serveFail();
    expect(sm.combo).toBe(0);
  });

  it('time bonus is monotonic in remaining patience', () => {
    const r1 = sm.serveSuccess(1, 3000, 14000);
    sm.serveFail();
    const sm2 = new ScoreManager();
    const r2 = sm2.serveSuccess(1, 10000, 14000);
    expect(r2.points).toBeGreaterThan(r1.points);
  });

  it('higher tier gives more points', () => {
    const r1 = sm.serveSuccess(1, 7000, 14000);
    sm.serveFail();
    const sm2 = new ScoreManager();
    const r2 = sm2.serveSuccess(3, 7000, 14000);
    expect(r2.points).toBeGreaterThan(r1.points);
  });

  it('combo multiplier increases points', () => {
    const r1 = sm.serveSuccess(1, 7000, 14000);
    const r2 = sm.serveSuccess(1, 7000, 14000);
    expect(r2.points).toBeGreaterThan(r1.points);
  });

  it('persists best score', () => {
    sm.serveSuccess(5, 8000, 9000);
    const sm2 = new ScoreManager();
    expect(sm2.bestScore).toBeGreaterThan(0);
  });

  it('coins awarded increases with combo', () => {
    const r1 = sm.serveSuccess(1, 7000, 14000);
    sm.serveSuccess(1, 7000, 14000);
    sm.serveSuccess(1, 7000, 14000);
    const r4 = sm.serveSuccess(1, 7000, 14000);
    expect(r4.coinsAwarded).toBeGreaterThanOrEqual(r1.coinsAwarded);
  });

  it('tracks customers served', () => {
    sm.serveSuccess(1, 7000, 14000);
    sm.serveSuccess(1, 7000, 14000);
    sm.serveFail();
    sm.serveSuccess(1, 7000, 14000);
    expect(sm.customersServed).toBe(3);
  });
});

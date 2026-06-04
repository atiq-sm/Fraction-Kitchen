export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  float(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.float() * (max - min + 1));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  pickDistinct<T>(arr: readonly T[], count: number): T[] {
    const pool = [...arr];
    const result: T[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = this.int(0, pool.length - 1);
      result.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return result;
  }
}

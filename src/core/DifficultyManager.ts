export interface PerfSample {
  correct: boolean;
  timeMs: number;
}

export interface DifficultyOptions {
  startTier: number;
  minTier: number;
  maxTier: number;
  windowSize: number;
  promoteAccuracy: number;
  demoteAccuracy: number;
  fastTimeMs: number;
}

const DEFAULTS: DifficultyOptions = {
  startTier: 1,
  minTier: 1,
  maxTier: 5,
  windowSize: 5,
  promoteAccuracy: 0.8,
  demoteAccuracy: 0.4,
  fastTimeMs: 6000,
};

export class DifficultyManager {
  private opts: DifficultyOptions;
  private tier: number;
  private window: PerfSample[] = [];
  private hintFlag = false;

  constructor(opts?: Partial<DifficultyOptions>) {
    this.opts = { ...DEFAULTS, ...opts };
    this.tier = this.opts.startTier;
  }

  get currentTier(): number {
    return this.tier;
  }

  record(sample: PerfSample): void {
    this.window.push(sample);
    if (this.window.length > this.opts.windowSize) {
      this.window.shift();
    }
    if (this.window.length < this.opts.windowSize) return;

    const correctCount = this.window.filter((s) => s.correct).length;
    const accuracy = correctCount / this.opts.windowSize;
    const avgTime =
      this.window.reduce((sum, s) => sum + s.timeMs, 0) / this.opts.windowSize;

    if (
      accuracy >= this.opts.promoteAccuracy &&
      avgTime <= this.opts.fastTimeMs &&
      this.tier < this.opts.maxTier
    ) {
      this.tier++;
      this.window = [];
      this.hintFlag = false;
    } else if (accuracy <= this.opts.demoteAccuracy && this.tier > this.opts.minTier) {
      this.tier--;
      this.window = [];
      this.hintFlag = true;
    }
  }

  shouldHint(): boolean {
    if (this.hintFlag) {
      this.hintFlag = false;
      return true;
    }
    return false;
  }

  reset(): void {
    this.tier = this.opts.startTier;
    this.window = [];
    this.hintFlag = false;
  }
}

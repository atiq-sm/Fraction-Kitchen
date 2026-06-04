export class ScoreManager {
  private _score = 0;
  private _coins = 0;
  private _combo = 0;
  private _bestScore = 0;
  private _customersServed = 0;

  constructor() {
    this._bestScore = this.loadBestScore();
  }

  get score(): number {
    return this._score;
  }
  get coins(): number {
    return this._coins;
  }
  get combo(): number {
    return this._combo;
  }
  get bestScore(): number {
    return this._bestScore;
  }
  get customersServed(): number {
    return this._customersServed;
  }

  serveSuccess(
    tier: number,
    remainingPatienceMs: number,
    patienceMs: number,
  ): { points: number; coinsAwarded: number; comboAfter: number } {
    this._combo++;
    this._customersServed++;

    const base = 100 * tier;
    const timeBonus = Math.round(50 * (remainingPatienceMs / patienceMs));
    const multiplier = 1 + 0.1 * Math.min(this._combo, 10);
    const points = Math.round((base + timeBonus) * multiplier);
    const coinsAwarded = 1 + Math.floor(this._combo / 3);

    this._score += points;
    this._coins += coinsAwarded;

    if (this._score > this._bestScore) {
      this._bestScore = this._score;
      this.saveBestScore(this._bestScore);
    }

    return { points, coinsAwarded, comboAfter: this._combo };
  }

  serveFail(): void {
    this._combo = 0;
  }

  reset(): void {
    this._score = 0;
    this._coins = 0;
    this._combo = 0;
    this._customersServed = 0;
  }

  private loadBestScore(): number {
    try {
      return parseInt(localStorage.getItem('fk_bestScore') ?? '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  private saveBestScore(score: number): void {
    try {
      localStorage.setItem('fk_bestScore', String(score));
    } catch {
      // localStorage unavailable
    }
  }
}

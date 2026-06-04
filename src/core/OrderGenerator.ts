import { Fraction } from './Fraction';
import type { Ingredient, Order, TierConfig } from './types';
import { RNG } from './RNG';

const MAX_ATTEMPTS = 20;

export class OrderGenerator {
  private counter = 0;

  constructor(
    private ingredients: readonly Ingredient[],
    private tiers: readonly TierConfig[],
    private rng: RNG,
  ) {}

  generate(tier: number): Order {
    const cfg = this.tiers.find((t) => t.tier === tier);
    if (!cfg) throw new Error(`Unknown tier: ${tier}`);

    const ingCount = this.rng.int(
      cfg.ingredientCount[0],
      Math.min(cfg.ingredientCount[1], this.ingredients.length),
    );
    const chosen = this.rng.pickDistinct(this.ingredients, ingCount);

    const requirements = chosen.map((ing) => ({
      ingredientId: ing.id,
      target: this.buildSolvableTarget(cfg),
    }));

    return {
      id: `order-${++this.counter}`,
      tier,
      requirements,
      patienceMs: cfg.patienceMs,
    };
  }

  private buildSolvableTarget(cfg: TierConfig): Fraction {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const n = this.rng.int(cfg.scoopsPerIngredient[0], cfg.scoopsPerIngredient[1]);
      let sum = Fraction.zero();

      for (let i = 0; i < n; i++) {
        const d = this.rng.pick(cfg.allowedDenominators);
        sum = sum.add(new Fraction(1, d));
      }

      if (sum.isZero()) continue;
      if (!cfg.allowMixedNumbers && sum.value() > 1) continue;
      if (sum.value() > cfg.maxTargetValue) continue;

      return sum;
    }

    return new Fraction(1, Math.max(...cfg.allowedDenominators));
  }
}

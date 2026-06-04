# Fraction Kitchen — Build Specification

**A gamified, adaptive fractions game for K–12 math practice. Built in Phaser 3 + TypeScript via an AI-first workflow.**

> **Purpose of this document:** A complete, self-contained engineering spec. An agentic coding tool (Claude Code) should be able to read this top-to-bottom and plan + implement the entire game without any other context. Every gameplay number has a committed default — change anything you disagree with, but nothing here should block implementation.

---

## 0. How to drive this with Claude Code

1. Create an empty repo and save this file as `SPEC.md` at the root (or `docs/SPEC.md`).
2. Open Claude Code in the repo and run `/init` so it generates a `CLAUDE.md`. Paste **§17 (Working Agreement)** into that `CLAUDE.md` so the conventions persist across sessions.
3. First prompt:
   > "Read `SPEC.md` in full. Produce an implementation plan as a checklist of milestones **M0–M8** (§16) with sub-tasks, written to `PLAN.md`. Then begin **M0**. After each milestone: run `npm test` and `npm run lint`, fix anything red, report results, commit with a conventional-commit message, and pause for my approval before starting the next milestone."
4. When it reaches **M5 (art)**, have it print the asset prompts from **§12** so you can batch-generate sprites locally (SDXL on the ROCm box) or with any image tool, drop the PNGs into `public/assets/`, and continue.
5. Keep `core/` Phaser-free (§8 dependency rule) so it can unit-test continuously as it goes.

---

## 1. Project Overview & Context

**What we're building.** A single-screen, browser-based arcade game where the player runs a juice/smoothie bar. Customers arrive with order tickets specifying fractional amounts of ingredients. The player assembles each drink by pouring fixed unit-fraction scoops into a glass until it matches the target, then serves it. Speed and accuracy drive score; difficulty adapts to the player in real time across five tiers from "counting quarters" to "simplify and combine unlike denominators under pressure."

**Why this design.** The fraction *is* the glass — a target of ¾ is a physical fill line, and combining ½ + ¼ visibly reaches it. Because validation compares **reduced** fractions, the game accepts every equivalent solution (½ + ¼, ¼ × 3, ⅜ × 2 all satisfy ¾). The player discovers equivalence and common denominators **through play**, not through a quiz modal. The math is intrinsic to the verb, which is the whole point.

**Evaluation framing (this is a hiring take-home).** The reviewer is assessing: (a) seamless integration of AI tools, (b) high visual/gameplay quality, (c) rapid delivery. So two things matter beyond the game itself: **make the AI workflow visible** (README + asset manifest + short Loom), and **polish one tight mechanic** rather than shipping three half-built ones.

**Success criteria.**
- Plays in a browser on desktop **and** mobile/tablet from a single live URL.
- The core loop is fun in under 10 seconds of play; "juice" (animation, particles, sound) makes it feel good.
- Adaptive difficulty visibly ramps and eases.
- Equivalent fraction solutions are accepted.
- Core logic is unit-tested.
- The AI-first build process is documented and legible to a reviewer.

---

## 2. Game Design Specification

### 2.1 Theme
A bright, friendly **juice/smoothie bar**. The player is the barista. (Theme is data-driven via `skill.json` — it can later become a pizza counter, plating station, etc., without code changes.)

### 2.2 Core Loop (one customer)
1. **Customer arrives** with an order **ticket**. The ticket states a target: either a single target fraction ("fill to **¾** cup") or, at higher tiers, a multi-ingredient recipe ("**½** cup strawberry + **¼** cup banana").
2. **Player assembles the drink.** A palette of **scoop buttons** is shown, each a fixed unit fraction (½, ⅓, ¼, ⅙, ⅛ — which sizes appear depends on the tier). Tapping a scoop pours that fraction into the glass. At multi-ingredient tiers the player first selects an ingredient, then a scoop size.
3. The **glass** shows the current fill level rising to match the running total, tinted by the blended ingredient colors, with the **target line** drawn across it. A live numeric readout shows the current total fraction.
4. **Serve.** Validation compares the assembled drink to the target using reduced-fraction equality:
   - **Exact match** → splash + confetti, coins fly to the score, combo increments, customer is happy, next customer.
   - **Over or under** → spill animation, customer frowns, lose a heart (or patience), glass can be dumped and retried while time remains.
5. The **patience/timer** ticks down throughout. Difficulty adapts based on rolling performance. Repeat.

### 2.3 Session model (committed default)
- **Lives-based endless run.** Start with **3 hearts**. Each customer has a **patience timer**; letting it expire, or serving wrong, costs a heart. Run ends at 0 hearts → Results screen.
- Score = customers served (weighted by tier) + time bonuses + combo bonuses. Coins are a cosmetic/feedback currency.
- `skill.json` can switch the mode to **fixed-count** (serve N customers) or **timed shift** (survive a fixed clock). Default = lives-based endless.

### 2.4 Win / lose
- **Lose:** hearts reach 0.
- **"Win"/progress:** there is no terminal win in endless mode — the goal is a high score and reaching higher tiers. Reaching **Tier 5** triggers a celebratory banner. (In fixed-count mode, serving all N customers is the win.)

### 2.5 Glass capacity & overfill
- Glass capacity default = **1.5 cups** (so mixed-number targets up to 1¼ fit with headroom). Pouring beyond capacity overflows: spill animation, and the serve will fail unless the total exactly equals the target.

---

## 3. The Math Model

This is the heart of the game. Keep it **pure** (no Phaser) and **typed**.

### 3.1 `Fraction` (immutable value object)
Always stored in reduced form with a positive denominator. Zero is `0/1`.

```ts
// core/Fraction.ts
export class Fraction {
  readonly num: number;
  readonly den: number; // > 0, reduced

  constructor(num: number, den: number); // throws on den === 0; reduces via gcd; normalizes sign to numerator

  static zero(): Fraction;          // 0/1
  static fromInt(n: number): Fraction;

  add(o: Fraction): Fraction;       // (a/b)+(c/d) -> reduced
  subtract(o: Fraction): Fraction;
  equals(o: Fraction): boolean;     // reduced equality -> THIS is what makes equivalence "just work"
  compare(o: Fraction): -1 | 0 | 1; // numeric comparison
  value(): number;                  // num/den as float, used for fill height
  simplify(): Fraction;             // returns reduced (ctor already reduces; provided for clarity)
  toString(): string;               // "3/4"
  toMixedString(): string;          // "3/4", "1 1/4", "2"
  isWhole(): boolean;
  isZero(): boolean;
}
```

**Key behaviors (test these):**
- `new Fraction(2,4).toString()` → `"1/2"`.
- `new Fraction(1,2).equals(new Fraction(2,4))` → `true`; `.equals(new Fraction(3,6))` → `true`.
- `new Fraction(5,4).toMixedString()` → `"1 1/4"`; `new Fraction(4,2).toMixedString()` → `"2"`.
- `new Fraction(0,5)` stores as `0/1`.
- `new Fraction(-1,2)` and `new Fraction(1,-2)` both normalize to numerator-negative `-1/2`.

### 3.2 Domain types

```ts
// core/types.ts
export interface Ingredient {
  id: string;        // "strawberry"
  name: string;      // "Strawberry"
  colorHex: string;  // liquid tint, e.g. "#FF4D6D"
}

export interface ScoopSize {
  fraction: Fraction; // a unit fraction like 1/4 (numerator MUST be 1)
  label: string;      // "¼"
}

export interface OrderRequirement {
  ingredientId: string;
  target: Fraction;   // required amount of this ingredient
}

export interface Order {
  id: string;
  tier: number;
  requirements: OrderRequirement[]; // length 1 at single-ingredient tiers
  patienceMs: number;
}

export interface Pour {
  ingredientId: string;
  amount: Fraction;   // the scoop poured (a unit fraction)
}

export type GlassState = Pour[];
```

### 3.3 Scoop palette model
The player pours **unit-fraction scoops**. The scoop sizes available in a given tier are derived from that tier's `allowedDenominators` → one button per denominator `d` representing `1/d`. This is what enables unlike-denominator composition (½ + ⅓ + ⅙ = 1) and equivalence (¼ + ¼ = ½) to emerge naturally. **The generator only ever uses denominators that are available as scoops** (§5), so every order is always solvable by the player.

### 3.4 Glass aggregation & validation

```ts
// core/Glass.ts (pure helpers)
export function totalFill(glass: GlassState): Fraction;          // sum of all pours
export function perIngredient(glass: GlassState): Map<string, Fraction>;

export interface ServeResult {
  success: boolean;
  reason: "exact" | "over" | "under" | "wrong-ingredient" | "extra-ingredient";
}

export function validateServe(glass: GlassState, order: Order): ServeResult;
```

**Validation rules:**
- For **each** requirement `r`: `perIngredient.get(r.ingredientId)` must `.equals(r.target)`.
- The set of poured ingredient ids must equal the set of required ingredient ids (no stray ingredients → `extra-ingredient`; missing → `wrong-ingredient`).
- If a single requirement and the totals don't match, classify as `over`/`under` via `compare` for nicer feedback.
- Equivalence is automatic: pouring `¼ + ¼` aggregates to `2/4` which **reduces to** `1/2` and `.equals` the target `1/2`.

---

## 4. Adaptive Difficulty (the "100% adaptive" demo)

Five tiers. The `DifficultyManager` moves the player up/down based on a rolling window of recent performance.

### 4.1 Tier table (committed defaults)

| Tier | Grade feel | Allowed denominators | Ingredients | Scoops per target | Mixed numbers | Patience | Teaches |
|------|-----------|----------------------|-------------|-------------------|---------------|----------|---------|
| **T1** | Gr 3 | {2, 3, 4} | 1 | 1–3 | no (≤1) | 14 s | Count unit fractions to a target |
| **T2** | Gr 3–4 | {2, 3, 4, 6} | 1 | 1–4 | no (≤1) | 12 s | Equivalence (multiple ways to ½) |
| **T3** | Gr 4–5 | {2, 3, 4, 6} | 1 | 2–4 | no (≤1) | 11 s | Unlike denominators / LCD in disguise |
| **T4** | Gr 5 | {2, 3, 4, 6, 8} | 1–2 | 2–5 | yes (≤1½) | 10 s | Multi-ingredient + mixed numbers |
| **T5** | Gr 5–6 | {2, 3, 4, 6, 8} | 2–3 | 2–6 | yes (≤1½) | 9 s | Simplify + combine under time pressure |

### 4.2 `DifficultyManager`

```ts
// core/DifficultyManager.ts
export interface PerfSample { correct: boolean; timeMs: number; }

export interface DifficultyOptions {
  startTier: number;       // default 1
  minTier: number;         // default 1
  maxTier: number;         // default 5
  windowSize: number;      // default 5 (orders considered)
  promoteAccuracy: number; // default 0.8
  demoteAccuracy: number;  // default 0.4
  fastTimeMs: number;      // default 6000 (avg serve time gating promotion)
}

export class DifficultyManager {
  constructor(opts?: Partial<DifficultyOptions>);
  get currentTier(): number;
  record(sample: PerfSample): void; // appends to window, re-evaluates
  shouldHint(): boolean;            // true right after a demote; resets when consumed
}
```

**Evaluation logic (pseudocode):**
```
record(sample):
  window.push(sample)
  if window.length > windowSize: window.shift()
  if window.length < windowSize: return
  acc = (# correct in window) / windowSize
  avgTime = mean(timeMs in window)
  if acc >= promoteAccuracy and avgTime <= fastTimeMs and tier < maxTier:
      tier += 1; window = []; hintFlag = false
  else if acc <= demoteAccuracy and tier > minTier:
      tier -= 1; window = []; hintFlag = true   // surface a hint next order
```

**Hint behavior (optional but nice):** when `shouldHint()` is true, the next order highlights one valid first scoop, or shows the target as a tip (e.g., "try two ¼ scoops"). Consuming the hint resets the flag.

---

## 5. Order Generation (solvability-guaranteed)

The generator must **never** produce an impossible order. It guarantees this by **constructing the target as a sum of available scoops**, so the same multiset is always a valid solution.

```ts
// core/OrderGenerator.ts
export interface TierConfig {
  tier: number;
  allowedDenominators: number[];
  ingredientCount: [min: number, max: number];
  scoopsPerIngredient: [min: number, max: number];
  allowMixedNumbers: boolean; // if false, each requirement target.value() must be <= 1
  maxTargetValue: number;     // e.g. 1 (no mixed) or 1.5 (mixed)
  patienceMs: number;
}

export class OrderGenerator {
  constructor(ingredients: Ingredient[], tiers: TierConfig[], rng: RNG);
  generate(tier: number): Order;
}
```

**Algorithm (pseudocode):**
```
generate(tier):
  cfg = tiers[tier]
  k = randInt(cfg.ingredientCount.min, min(cfg.ingredientCount.max, ingredients.length))
  chosen = pickDistinct(ingredients, k)
  requirements = []
  for ing in chosen:
      target = buildSolvableTarget(cfg)
      requirements.push({ ingredientId: ing.id, target })
  return { id: uuid(), tier, requirements, patienceMs: cfg.patienceMs }

buildSolvableTarget(cfg):
  for attempt in 1..MAX_ATTEMPTS (e.g. 20):
      n = randInt(cfg.scoopsPerIngredient.min, cfg.scoopsPerIngredient.max)
      sum = Fraction.zero()
      for i in 1..n:
          d = choice(cfg.allowedDenominators)
          sum = sum.add(new Fraction(1, d))   // a unit-fraction scoop
      if sum.isZero(): continue
      if !cfg.allowMixedNumbers and sum.value() > 1: continue
      if sum.value() > cfg.maxTargetValue: continue
      return sum   // reduced automatically; guaranteed solvable from allowed scoops
  // fallback: single smallest available scoop
  return new Fraction(1, max(cfg.allowedDenominators))
```

**Invariant for tests:** for every generated `Order`, each `requirement.target` is expressible as a sum of unit fractions drawn from that tier's `allowedDenominators`, `target.value() > 0`, and (when `allowMixedNumbers` is false) `target.value() <= 1`. Ingredient ids are distinct and count is within `ingredientCount`.

**RNG:** use a small seedable PRNG (e.g., mulberry32) wrapped in an `RNG` interface (`int(min,max)`, `pick(arr)`, `float()`), so order generation and tests are deterministic.

---

## 6. Scoring & Economy

```ts
// core/ScoreManager.ts
export class ScoreManager {
  get score(): number;
  get coins(): number;
  get combo(): number;       // consecutive exact serves
  get bestScore(): number;   // from localStorage

  serveSuccess(tier: number, remainingPatienceMs: number, patienceMs: number): {
    points: number; coinsAwarded: number; comboAfter: number;
  };
  serveFail(): void;         // resets combo to 0
  reset(): void;
}
```

**Formulas (committed defaults):**
- Base points per serve = `100 * tier`.
- Time bonus = `round(50 * (remainingPatienceMs / patienceMs))` (faster = more).
- Combo multiplier applied to (base + time bonus): `multiplier = 1 + 0.1 * min(combo, 10)`.
- Coins awarded per success = `1 + floor(combo / 3)` (purely for juice/feedback).
- On any failed serve, `combo` resets to 0.
- Persist `bestScore` to `localStorage`.

---

## 7. Tech Stack & Project Setup

- **Build:** Vite (instant HMR, static `dist/` output).
- **Engine:** Phaser 3 (latest 3.x).
- **Language:** TypeScript (`strict: true`).
- **Tests:** Vitest (runs `core/` headless and fast).
- **Lint/format:** ESLint + Prettier.
- **Fonts:** Google Fonts via `@font-face` / WebFont loader (see §11).

**Setup commands:**
```bash
npm create vite@latest fraction-kitchen -- --template vanilla-ts
cd fraction-kitchen
npm i phaser
npm i -D vitest eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
# scripts in package.json:
#   "dev": "vite",
#   "build": "tsc && vite build",
#   "preview": "vite preview",
#   "test": "vitest run",
#   "test:watch": "vitest",
#   "lint": "eslint . --ext .ts"
```

Canvas: base resolution **1280×720**, `Phaser.Scale.FIT` + `CENTER_BOTH` so it letterboxes cleanly on any device; unify mouse + touch via Phaser pointer events.

---

## 8. Architecture & File Tree

```
fraction-kitchen/
├─ index.html
├─ public/
│  └─ assets/
│     ├─ sprites/        # generated PNGs (transparent)
│     ├─ audio/          # sfx + music
│     └─ fonts/          # if self-hosting
├─ src/
│  ├─ main.ts            # Phaser.Game config, scene registration
│  ├─ config/
│  │  ├─ skill.json      # <- THE "Skill File" (data-driven, §10)
│  │  └─ constants.ts    # colors, sizes, layout anchors
│  ├─ core/              # PURE TS — NO PHASER IMPORTS
│  │  ├─ Fraction.ts
│  │  ├─ types.ts
│  │  ├─ RNG.ts
│  │  ├─ Glass.ts        # totalFill, perIngredient, validateServe
│  │  ├─ OrderGenerator.ts
│  │  ├─ DifficultyManager.ts
│  │  └─ ScoreManager.ts
│  ├─ scenes/
│  │  ├─ BootScene.ts
│  │  ├─ PreloadScene.ts
│  │  ├─ MenuScene.ts
│  │  ├─ GameScene.ts    # owns the loop; instantiates objects + core managers
│  │  ├─ HudScene.ts     # runs in PARALLEL over GameScene
│  │  └─ ResultsScene.ts
│  ├─ objects/
│  │  ├─ Glass.ts        # visual glass: masked liquid, fill tween, color blend, target line
│  │  ├─ ScoopButton.ts  # a scoop-size button (+ ingredient at multi tiers)
│  │  ├─ Ticket.ts       # renders the order
│  │  └─ Customer.ts     # sprite + emotes
│  └─ ui/
│     ├─ TimerBar.ts
│     ├─ Hearts.ts
│     ├─ ComboText.ts
│     └─ CoinCounter.ts
├─ tests/                # vitest specs for core/
└─ SPEC.md
```

**Dependency rule (critical):** `src/core/` and `src/config/` **must not import Phaser**. Phaser may only be imported by `main.ts`, `scenes/`, `objects/`, `ui/`. This keeps the math testable and makes the logic easy to generate and verify in isolation.

**Data flow:** `GameScene` holds the core managers (`OrderGenerator`, `DifficultyManager`, `ScoreManager`) and the current `GlassState`. Player input on a `ScoopButton` pushes a `Pour` and updates the visual `Glass`. Pressing **Serve** calls `validateServe`, feeds a `PerfSample` to `DifficultyManager`, updates `ScoreManager`, emits events the `HudScene` listens to, then requests the next order at `difficulty.currentTier`. Communicate `GameScene → HudScene` via the scene event emitter (`this.events` / registry), not direct references.

---

## 9. Module-by-Module Responsibilities

- **`core/Fraction.ts`** — immutable rational arithmetic; the reduced-`equals` is the equivalence engine.
- **`core/RNG.ts`** — seedable PRNG + `int/pick/float`; injected into the generator for determinism.
- **`core/Glass.ts`** — pure aggregation + `validateServe` (no rendering).
- **`core/OrderGenerator.ts`** — solvability-guaranteed orders per tier (§5).
- **`core/DifficultyManager.ts`** — rolling-window promote/demote + hint flag (§4).
- **`core/ScoreManager.ts`** — points, combo, coins, best-score persistence (§6).
- **`scenes/BootScene`** — load `skill.json` + fonts; build runtime config; start Preload.
- **`scenes/PreloadScene`** — load all sprites/audio with a progress bar.
- **`scenes/MenuScene`** — title, Start, How-to (3 illustrated steps), mute toggle, best score.
- **`scenes/GameScene`** — the loop; owns managers + objects; spawns customers/orders; handles serve.
- **`scenes/HudScene`** — parallel overlay: timer bar, hearts, score, coins, combo, current ticket card. Listens to GameScene events.
- **`scenes/ResultsScene`** — final score, best, tier reached, customers served, Play Again.
- **`objects/Glass`** — masked liquid render, fill tween with overshoot, ingredient color blend, target line, dump-glass.
- **`objects/ScoopButton`** — shows scoop label (and ingredient swatch at multi tiers); press animation; emits pour.
- **`objects/Ticket`** — renders requirement(s) as friendly fraction chips.
- **`objects/Customer`** — arrival slide-in, idle bob, happy/sad emotes.
- **`ui/*`** — small presentational components driven by HUD events.

---

## 10. `skill.json` — The Skill File (data-driven config)

This file **is** Phase 1 of the company's own pipeline ("the Skill File"). Keeping all gameplay/math parameters here means changing grade band, theme, ingredients, session length, or difficulty curve is a config edit — **no code change**. Call this out explicitly in the README.

### 10.1 Schema (described)
- `meta`: `{ title, theme, sessionMode: "endless" | "fixedCount" | "timed", lives, customerCount?, shiftMs? }`
- `glass`: `{ capacityCups: number }`
- `ingredients`: `Ingredient[]`
- `difficulty`: `Partial<DifficultyOptions>` (startTier, windowSize, promote/demote thresholds, fastTimeMs)
- `tiers`: `TierConfig[]` (the table in §4.1)

### 10.2 Full example
```json
{
  "meta": {
    "title": "Fraction Kitchen",
    "theme": "smoothie-bar",
    "sessionMode": "endless",
    "lives": 3
  },
  "glass": { "capacityCups": 1.5 },
  "ingredients": [
    { "id": "strawberry", "name": "Strawberry", "colorHex": "#FF4D6D" },
    { "id": "banana",     "name": "Banana",     "colorHex": "#FFCE45" },
    { "id": "blueberry",  "name": "Blueberry",  "colorHex": "#5B6CFF" },
    { "id": "lime",       "name": "Lime",       "colorHex": "#3CB371" }
  ],
  "difficulty": {
    "startTier": 1, "minTier": 1, "maxTier": 5,
    "windowSize": 5, "promoteAccuracy": 0.8, "demoteAccuracy": 0.4, "fastTimeMs": 6000
  },
  "tiers": [
    { "tier": 1, "allowedDenominators": [2,3,4],     "ingredientCount": [1,1], "scoopsPerIngredient": [1,3], "allowMixedNumbers": false, "maxTargetValue": 1.0, "patienceMs": 14000 },
    { "tier": 2, "allowedDenominators": [2,3,4,6],   "ingredientCount": [1,1], "scoopsPerIngredient": [1,4], "allowMixedNumbers": false, "maxTargetValue": 1.0, "patienceMs": 12000 },
    { "tier": 3, "allowedDenominators": [2,3,4,6],   "ingredientCount": [1,1], "scoopsPerIngredient": [2,4], "allowMixedNumbers": false, "maxTargetValue": 1.0, "patienceMs": 11000 },
    { "tier": 4, "allowedDenominators": [2,3,4,6,8], "ingredientCount": [1,2], "scoopsPerIngredient": [2,5], "allowMixedNumbers": true,  "maxTargetValue": 1.5, "patienceMs": 10000 },
    { "tier": 5, "allowedDenominators": [2,3,4,6,8], "ingredientCount": [2,3], "scoopsPerIngredient": [2,6], "allowMixedNumbers": true,  "maxTargetValue": 1.5, "patienceMs": 9000 }
  ]
}
```

---

## 11. Visual Design & Art Direction

**Aesthetic direction (committed): "Sunny Hand-Crafted Juice Bar."** Warm, bright, rounded, tactile — a kids' app with real craft, not a generic flat template. Bold dominant warm palette with one sharp coral accent; thick friendly outlines; soft drop shadows; subtle paper-grain texture and a peach→mango gradient backdrop for depth (not a flat fill). Avoid the generic AI look entirely: no Inter/Roboto/Arial, no purple-on-white gradients, no cookie-cutter card grid.

**Color palette (CSS-variable / constants set):**
| Token | Hex | Use |
|-------|-----|-----|
| `bg-top` | `#FFD8A8` | backdrop gradient top (mango) |
| `bg-bottom` | `#FFB088` | backdrop gradient bottom (peach) |
| `cream` | `#FFF4E0` | counter / panels |
| `surface` | `#FFFDF7` | glass UI / cards |
| `ink` | `#3A2E39` | text + outlines (deep plum) |
| `accent` | `#FF5E5B` | primary CTA / coral pop |
| `mint` | `#3CB371` | success |
| `mango` | `#FFB703` | coins / highlights |
| `berry` | `#FF4D6D` | strawberry |
| `blue` | `#5B6CFF` | blueberry |

**Typography:** distinctive rounded **display** font for the title, score, and big numbers (e.g., **Baloo 2**, **Fredoka**, or **Chango**); refined rounded **body/HUD** font (e.g., **Nunito** or **Quicksand**). Pair one display + one body; never Inter/Arial/system.

**Layout (1280×720):**
- **Top strip (HUD scene):** hearts (top-left), score + coins (top-right), patience bar (full-width under the strip).
- **Center-left:** the **glass**, large, with the target line and live total readout beneath it.
- **Center-right / above counter:** the **customer** + speech-bubble **ticket** (fraction chips).
- **Bottom:** the **scoop palette** — large tap targets (min ~96px) with the fraction label drawn as a clean stacked fraction; at multi tiers, an ingredient selector row above the scoops.
- Use generous spacing, rounded panels, and a wood/counter band along the bottom for atmosphere.

**HUD specifics:** patience bar lerps green→amber→red and pulses near zero; combo shown as a punchy "x3!" near the glass; coins counter has a little coin icon that spins on award.

---

## 12. Asset Manifest + AI Generation Prompts

Generate every asset with AI (local SDXL on the ROCm box, or any image tool). **Maintain `public/assets/assets.md`** listing each asset and the exact prompt used — this doubles as evidence of the AI workflow for the reviewer.

**Global style suffix to append to every sprite prompt:**
> "flat vector illustration, bold clean rounded outlines, bright saturated colors, soft drop shadow, kid-friendly mobile-game art, centered, transparent background, no text"

| Asset | File | Size | Prompt (prefix; append global style suffix) |
|-------|------|------|---------------------------------------------|
| Empty glass (back) | `glass_back.png` | 512×640 | "an empty tall clear drinking glass, back layer, subtle glass shading" |
| Glass front/highlights | `glass_front.png` | 512×640 | "front highlights and rim of a clear drinking glass, mostly transparent, glossy reflections" |
| Scoop button base | `scoop_btn.png` | 256×256 | "round wooden ice-cream-style scoop tool icon, top-down, playful" |
| Strawberry | `ing_strawberry.png` | 256×256 | "single ripe strawberry, cute" |
| Banana | `ing_banana.png` | 256×256 | "single banana, cute" |
| Blueberry | `ing_blueberry.png` | 256×256 | "small cluster of blueberries, cute" |
| Lime | `ing_lime.png` | 256×256 | "bright lime slice, cute" |
| Customer (happy) | `cust_happy.png` | 512×512 | "friendly cartoon kid customer smiling, upper body" |
| Customer (sad) | `cust_sad.png` | 512×512 | "cartoon kid customer disappointed, upper body" |
| Coin | `coin.png` | 128×128 | "shiny gold coin with a fruit emboss" |
| Heart | `heart.png` | 128×128 | "glossy red heart life icon" |
| Counter/background | `bg_counter.png` | 1280×720 | "cozy juice bar counter scene, warm wood, blurred background, peach-to-mango sky" |
| Splash particle | `droplet.png` | 64×64 | "single rounded juice droplet" |
| Confetti particle | `confetti.png` | 64×64 | "small rounded confetti piece" |

**Audio (generate or use CC0):** pour (soft liquid blip), button tap, serve success chime (pitched up with combo — see §13), error buzz, heart-loss thud, light background loop. Files in `public/assets/audio/`.

**Liquid rendering approach (Phaser, concrete):**
- Build the visual `Glass` as a container: `glass_back` sprite, then a **liquid layer**, then `glass_front` sprite on top.
- The liquid layer is a `Phaser.GameObjects.Graphics` rectangle filling from the glass bottom; mask it with a **geometry mask** shaped to the glass interior so it never spills outside the glass outline.
- Track a numeric `fillLevel` (0..1 of capacity). On each pour, **tween `fillLevel`** to the new value over ~250ms with `Back.easeOut` (≈6% overshoot for a satisfying wobble), redrawing the rectangle height each frame.
- **Color blend:** keep a running weighted average of poured ingredient colors (weighted by each pour's `value()`), in RGB, and set the liquid fill color to the result. (Single-flavor tiers → just that color.)
- **Surface wobble:** on each pour, overlay a thin ellipse at the liquid surface and tween its scaleY with a quick sine for ~300ms.
- **Target line:** a dashed horizontal line + a small "¾" chip at `capacity * target.value()` height.

---

## 13. Juice & Game Feel Spec

Most of this is tweens + particles + sound — high feel for low effort. Implement all of it; this is what the "visual/gameplay quality" score rewards.

- **Scoop button press:** scale `0.92 → 1.06 → 1.0`, ~120ms, `Back.easeOut`; soft tap SFX.
- **Pour:** 8–14 droplet particles in the ingredient color, gravity, ~400ms life; liquid tween (§12); surface wobble; pour SFX.
- **Serve success:** 20–30 confetti particles; 3–6 coins arc to the coin counter with stagger; score **counts up** via tween; customer scale-bounce + happy emote swap; success chime with pitch `= baseRate * (1 + 0.05 * min(combo,10))`; brief camera **punch** (zoom 1.0→1.04→1.0, 120ms).
- **Serve fail:** glass shake (x ±6px, 4 oscillations, ~200ms); overflow/spill droplets; quick desaturate flash; error buzz; one heart animates out (scale-down + fade).
- **Patience near zero (<25%):** bar pulses (scale 1.0↔1.04) at increasing rate; subtle screen vignette pulse.
- **Customer arrival:** slide in from right with `Back.easeOut`; gentle idle bob (y sine, ~2s loop).
- **Combo:** floating "x3!" text rises + fades above the glass; success camera punch intensity scales gently with combo (capped).
- **Tier change:** "Level Up!" banner + sparkle on promote; soft "let's slow down" tip on demote (with the optional hint).

**Performance:** use **object pools** for droplets/confetti/coins; never allocate particles per-frame.

---

## 14. Testing Strategy (Vitest, `core/` only)

Because `core/` is Phaser-free, tests run fast and headless. Target high coverage on `core/`.

- **`Fraction`:** addition/subtraction correctness; reduction (`2/4 → 1/2`, `6/8 → 3/4`); equivalence equality (`1/2 == 2/4 == 3/6`); `compare`; `value`; `toMixedString` (`5/4 → "1 1/4"`, `4/2 → "2"`, `3/4 → "3/4"`); zero handling; denominator always positive; sign normalization.
- **`OrderGenerator` (property/invariant test):** across many seeds × all tiers, assert each generated order satisfies the §5 invariant — target `> 0`, solvable from the tier's allowed scoop denominators, `≤ 1` when `allowMixedNumbers` is false, `≤ maxTargetValue` otherwise; ingredient count within bounds; ingredients distinct. Determinism: same seed → same orders.
- **`Glass.validateServe`:** exact match passes; equivalent combinations pass (`¼+¼` for `½`); over/under classified; stray ingredient → `extra-ingredient`; missing ingredient → `wrong-ingredient`; multi-ingredient per-ingredient matching.
- **`DifficultyManager`:** all-correct-and-fast samples promote exactly after `windowSize`; all-wrong samples demote and raise the hint flag; never exceeds `min`/`max`; window clears on a tier change.
- **`ScoreManager`:** combo multiplier math; time bonus is monotonic in remaining patience; fail resets combo; best-score persistence (mock `localStorage`).

---

## 15. Build, Deploy, Persistence, Responsiveness

- **Build:** `npm run build` → static `dist/`.
- **Deploy:** Vercel, Netlify, or itch.io (drag-and-drop the build). **A live clickable URL beats "clone my repo"** — make this the headline of the submission.
- **Persistence:** `localStorage` for best score + mute/settings (this runs on the user's own machine/host, so `localStorage` is fine here — unlike Claude.ai artifacts).
- **Responsive:** `Scale.FIT` + `CENTER_BOTH`; verify on a real phone and a tablet; tap targets ≥ ~96px; test both portrait and landscape (lock to landscape or letterbox gracefully).
- **Pause/mute:** simple pause overlay and a mute toggle.
- **No network calls;** fully offline-playable after load.

---

## 16. Implementation Milestones (M0–M8)

Each milestone has acceptance criteria (AC) and a suggested commit. Run `npm test` + `npm run lint` and pause for approval after each.

- **M0 — Scaffold.** Vite + Phaser + TS + Vitest + ESLint/Prettier; `main.ts` with empty Boot→Preload→Menu→Game→Results scenes; blank canvas runs. **AC:** `npm run dev` shows a running Phaser canvas; `npm test` runs (0 tests OK). _commit:_ `chore: scaffold project`.
- **M1 — Core math.** `Fraction`, `types`, `RNG`, `Glass` helpers + full tests. **AC:** all Fraction/Glass tests green; dependency rule holds (no Phaser in `core/`). _commit:_ `feat(core): fraction + glass engine`.
- **M2 — Generation + difficulty.** `OrderGenerator` (solvability), `DifficultyManager`, `ScoreManager` + tests. **AC:** generator invariant property test green; difficulty promote/demote tests green. _commit:_ `feat(core): order generation + adaptive difficulty`.
- **M3 — Playable gray-box.** `GameScene` wires a scoop palette (plain rects), a graphics glass with fill + target line, a text ticket, a Serve button, validation, and next-order flow — **no art, no timer.** **AC:** can pour scoops, see the running total, serve, get pass/fail, and equivalence is accepted. _commit:_ `feat(game): playable gray-box loop`.
- **M4 — Systems & HUD.** `HudScene` (timer/patience, hearts, score, coins, combo, ticket card); lives; `ResultsScene`; restart; wire `DifficultyManager` so served orders change difficulty; optional hint. **AC:** full run start → lose → results → replay; tier visibly ramps with performance. _commit:_ `feat(game): hud, lives, scoring, results`.
- **M5 — Art integration.** Load AI assets; replace gray-box with sprites; implement masked liquid render + color blend; load fonts; backdrop. **AC:** it reads as a real game; liquid fills correctly and blends ingredient colors. _commit:_ `feat(art): sprites, liquid render, fonts`.
- **M6 — Juice.** All tweens/particles/SFX per §13; camera punches; customer emotes; combo text. **AC:** the §13 feel checklist is fully implemented and the game feels good. _commit:_ `feat(polish): juice pass`.
- **M7 — Balance, responsive, persist.** Tune tier thresholds + patience for a good curve; verify `Scale.FIT` on phone/tablet; `localStorage` best score; mute + pause. **AC:** plays well on mobile; difficulty curve feels fair; best score persists. _commit:_ `feat(game): balance, responsive, persistence`.
- **M8 — Ship.** Write `README.md` (run/deploy steps, **AI-workflow section** mapping skill-file → design brief → AI assets → assembly, the architecture + dependency rule, and a note that the data model is serializable for future head-to-head multiplayer); finalize `assets.md`; record a 2–3 min Loom; `npm run build`; deploy; final QA against §18. **AC:** live URL works on desktop + mobile; §18 checklist complete. _commit:_ `docs: readme + build + deploy`.

**Order of value if time runs short:** M0–M4 give a fully playable, adaptive game (graybox). M5–M6 are where the visual/gameplay-quality points are won. M8 (README + Loom + live URL) is mandatory for the eval even if polish is trimmed.

---

## 17. Working Agreement (paste into `CLAUDE.md`)

- **TypeScript strict;** no `any`. ES modules, named exports, small single-responsibility files (<~200 lines).
- **Dependency rule (enforced):** `src/core/` and `src/config/` must **not** import Phaser. Phaser only in `main.ts`, `scenes/`, `objects/`, `ui/`.
- **`Fraction` is immutable;** all `core/` logic is pure and unit-tested.
- **Config over magic numbers:** gameplay/math values come from `skill.json` or `config/constants.ts`, never hard-coded inside logic.
- **After each milestone:** run `npm test` and `npm run lint`, fix red, commit with a conventional-commit message, then pause for approval.
- **Object-pool** particles and frequently spawned objects; no per-frame allocations in `update`.
- **Scene communication** via the event emitter / registry, not cross-scene direct references.
- **Assets:** save generated PNGs to `public/assets/`, and record the generation prompt for each in `public/assets/assets.md`.
- **When ambiguous,** choose the simplest data-driven option, add a `// TODO(config)` note, and keep moving — don't block.
- **No network calls;** `localStorage` only (best score + settings).

---

## 18. Definition of Done / Submission Checklist

- [ ] **Live URL** (Vercel/Netlify/itch) loads and plays on **desktop and mobile**.
- [ ] Core loop works: order → pour scoops → serve → validate → next.
- [ ] **Equivalent solutions accepted** (½+¼, ¼×3, etc. all satisfy ¾).
- [ ] **Adaptive difficulty** visibly ramps and eases; all 5 tiers reachable.
- [ ] **Juice present:** pour/serve/fail feedback, sound, combos, particles.
- [ ] **Tests pass:** Fraction, OrderGenerator solvability invariant, DifficultyManager, ScoreManager.
- [ ] **README** documents the AI-first workflow (skill-file → design brief → AI assets → assembly), the architecture + dependency rule, and run/deploy steps.
- [ ] **`assets.md`** lists every asset + the AI prompt used to generate it.
- [ ] **2–3 min Loom** walking the AI workflow and gameplay.
- [ ] **`skill.json` drives the game** — changing tiers/ingredients/theme needs no code edit.
- [ ] Data model is serializable; README notes the multiplayer-ready path.

---

## 19. Stretch Goals (only if ahead of schedule)

- **Head-to-head multiplayer:** two players race the same ticket; serialize order + glass state over a simple WebSocket relay. (Architecture already supports it — keep state plain data.)
- **Theme swaps via `skill.json`:** pizza-fractions counter, plating station.
- **Placement mini-test** at start to set the opening tier.
- **Daily challenge** seed (deterministic via the seeded RNG).
- **Accessibility:** colorblind-safe ingredient patterns + larger-text mode.

# Fraction Kitchen

**A gamified math adventure game for K-12 practice — fractions, addition, subtraction, and multiplication.**

Players run a juice bar where customers order fractional amounts of ingredients. But that's just the start: a full roguelike adventure mode sends players through a branching overworld map of math challenges, shops, treasure chests, and a final boss battle.

**Live demo:** [https://atiq-sm.github.io/Fraction-Kitchen/](https://atiq-sm.github.io/Fraction-Kitchen/)

## Quick Start

```bash
npm install
npm run dev        # opens at localhost:5173
npm test           # 216 tests, <1s
npm run build      # static dist/ for deployment
```

## Game Modes

### Adventure Mode (Roguelike)

A Slay-the-Spire-style branching map with 4 rows of nodes leading to a boss fight:

| Node Type | What Happens | Reward |
|-----------|-------------|--------|
| Addition (+) | 3 multiple-choice addition problems | 15-30 coins |
| Subtraction (-) | 3 subtraction problems | 15-30 coins |
| Multiplication (x) | 3 multiplication problems | 20-40 coins |
| Fractions (glass) | 3 fraction-pouring customers | 25-50 coins |
| Boss (skull) | 5 mixed problems, harder difficulty | 100 coins + victory |
| Shop (cart) | Buy power-ups with coins | — |
| Chest (gift) | Random coin reward | 20-50 coins |
| Rest (bed) | Heal +1 heart | — |

**Flow:** Menu -> Map -> pick a node -> complete encounter -> return to map -> reach and defeat boss.

Difficulty scales by row — early nodes use single-digit arithmetic, later rows introduce larger numbers and fractions.

### Quick Play

Classic endless fractions mode. Pour unit-fraction scoops into a glass to match customer orders. The game accepts **every equivalent solution** (1/2 + 1/4, 1/4 x 3, 3/8 x 2 all satisfy 3/4) because validation uses reduced-fraction equality. Difficulty adapts in real time across five tiers.

### Multiplayer

Head-to-head fraction battles via WebSocket. Create or join a room with a 4-character code. Both players get the same RNG seed for identical order sequences — first correct serve wins each round.

```bash
cd server && npm install && npm start   # WebSocket relay on port 8080
```

## Architecture

```
src/
├── core/                  <- Pure TypeScript, NO Phaser imports (enforced by ESLint)
│   ├── Fraction.ts        <- Immutable rational arithmetic, reduced-equality engine
│   ├── Glass.ts           <- Aggregation + validateServe (equivalence acceptance)
│   ├── OrderGenerator.ts  <- Solvability-guaranteed orders (sum of available scoops)
│   ├── DifficultyManager.ts <- Rolling-window adaptive promote/demote across 5 tiers
│   ├── ScoreManager.ts    <- Points, combo multiplier, time bonus, persistence
│   ├── MapGenerator.ts    <- Branching node-graph map (roguelike overworld)
│   ├── MathProblemGenerator.ts <- Addition/subtraction/multiplication problem gen
│   ├── RunState.ts        <- Roguelike run state (lives, coins, map position, power-ups)
│   ├── ShopManager.ts     <- Power-up shop with persistent coins (localStorage)
│   ├── RNG.ts             <- Seeded random number generator
│   └── types.ts           <- Shared type definitions
├── scenes/                <- Phaser scene lifecycle
│   ├── BootScene.ts       <- Asset loading bootstrap
│   ├── PreloadScene.ts    <- Texture generation + loading screen
│   ├── MenuScene.ts       <- Main menu (Adventure / Quick Play / Multiplayer)
│   ├── MapScene.ts        <- Roguelike overworld map with node selection
│   ├── GameScene.ts       <- Fraction-pouring gameplay (glass + scoops)
│   ├── MathBattleScene.ts <- Multiple-choice math problems (add/sub/mul)
│   ├── ShopScene.ts       <- Power-up shop between encounters
│   ├── HudScene.ts        <- Overlay HUD (hearts, score, timer, combo)
│   ├── ResultsScene.ts    <- End-of-run results and stats
│   └── LobbyScene.ts      <- Multiplayer room creation/joining
├── objects/               <- Visual game objects
│   ├── GlassVisual.ts     <- Animated glass with geometry-masked liquid
│   ├── ScoopButton.ts     <- Fraction scoop interaction buttons
│   ├── Customer.ts        <- Animated customer with order ticket
│   └── Ticket.ts          <- Order display ticket
├── art/                   <- Programmatic texture generation (ArtGenerator)
├── audio/                 <- Web Audio API synthesized sounds (zero audio files)
├── effects/               <- Particle + tween effects (ParticleManager)
├── ui/                    <- HUD components (TimerBar, Hearts, ComboText, CoinCounter)
├── multiplayer/           <- WebSocket client for head-to-head mode
├── utils/                 <- Color utilities, localStorage persistence
└── config/
    ├── constants.ts       <- Game dimensions, colors, fonts
    └── skill.json         <- Data-driven gameplay parameters (tiers, ingredients, timing)
```

**Dependency rule:** `src/core/` is Phaser-free and fully unit-tested. All 216 tests run headless in <1 second. The math engine can be verified and iterated independently of the rendering layer.

## Skill File (`skill.json`)

All gameplay parameters are data-driven. Changing grade band, theme, ingredients, session length, or difficulty curve requires no code changes — edit `src/config/skill.json`.

Defines:
- Session mode: endless (lives), fixed-count, or timed shift
- Ingredients: name, ID, and color (blended visually when poured)
- 5 difficulty tiers: allowed denominators, ingredient count, scoop range, patience timers
- Adaptive difficulty thresholds: promote/demote accuracy, speed gating, window size

## Adaptive Difficulty (Fractions Mode)

| Tier | Grade | Denominators | Ingredients | Mixed Numbers | Patience |
|------|-------|-------------|-------------|---------------|----------|
| T1 | Gr 3 | {2, 3, 4} | 1 | No | 14s |
| T2 | Gr 3-4 | {2, 3, 4, 6} | 1 | No | 12s |
| T3 | Gr 4-5 | {2, 3, 4, 6} | 1 | No | 11s |
| T4 | Gr 5 | {2, 3, 4, 6, 8} | 1-2 | Yes | 10s |
| T5 | Gr 5-6 | {2, 3, 4, 6, 8} | 2-3 | Yes | 9s |

The `DifficultyManager` uses a rolling window of 5 recent orders. Promote when >=80% correct and average serve time <=6s. Demote when <=40% correct.

## Shop & Power-ups

Coins earned during play persist via localStorage. Spend them in the shop (accessible from map nodes or before Quick Play):

- **Extra Heart** — +1 max life
- **Speed Boost** — more patience time per order
- **Double Coins** — 2x coin earnings for the run
- **Hint Power** — shows a hint on the next order
- **Lucky Start** — begin with bonus coins

## Tech Stack

- **Phaser 3.80** — WebGL game engine, Scale.FIT responsive layout
- **TypeScript** — strict mode, no `any`
- **Vite** — instant HMR, static build
- **Vitest** — fast headless unit tests for `core/`
- **ESLint + Prettier** — enforced code style + Phaser import ban in `core/`
- **Web Audio API** — all sounds synthesized at runtime (zero audio files)
- **WebSocket (ws)** — multiplayer relay server
- **GitHub Actions** — auto-deploy to GitHub Pages on push to `main`

## Testing

```bash
npm test           # 216 tests in <1s
```

Coverage areas:
- **Fraction**: arithmetic, reduction, equivalence (`1/2 == 2/4 == 3/6`), edge cases
- **OrderGenerator**: solvability invariant across 30 seeds x 5 tiers (150 property tests)
- **DifficultyManager**: promote/demote logic, bounds, window clearing, hint flags
- **ScoreManager**: combo multiplier math, time bonus monotonicity, persistence
- **Glass**: aggregation, all 5 ServeResult types, multi-ingredient validation

## Deployment

Auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

To set up:
1. Go to repo Settings -> Pages
2. Set Source to **GitHub Actions**
3. Push to `main` — the workflow runs tests, builds, and deploys

Manual deploy:
```bash
npm run build      # produces dist/
# Deploy dist/ to any static host
```

The game is fully offline-playable after initial load. No network calls in single-player mode.

## AI-First Workflow

This project was built using an AI-first development workflow with Claude Code:

1. **Spec-driven**: Build specification fed to Claude Code, producing a milestone-based implementation plan with acceptance criteria per phase
2. **Core engine (test-first)**: Pure TypeScript math engine developed test-first with 216 Vitest cases covering equivalence, solvability invariants, and adaptive difficulty
3. **Programmatic art**: All visuals generated via Phaser's Graphics API — layered gradients, geometry masking for liquid, shape composition for characters
4. **Synthesized audio**: All sounds created at runtime using Web Audio API oscillators, filtered noise, and envelopes
5. **Roguelike expansion**: Adventure mode with branching map, multiple math types, boss battles, and shop system added iteratively with scene lifecycle debugging

See `public/assets/assets.md` for the complete asset manifest.

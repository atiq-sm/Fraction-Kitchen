# Fraction Kitchen

**A gamified, adaptive fractions game for K–12 math practice.**

Players run a juice/smoothie bar where customers order fractional amounts of ingredients. Pour unit-fraction scoops into a glass to match the target — the game accepts **every equivalent solution** (½+¼, ¼×3, ⅜×2 all satisfy ¾) because validation uses reduced-fraction equality. Difficulty adapts in real time across five tiers.

## Quick Start

```bash
npm install
npm run dev        # opens at localhost:5173
npm test           # 216 tests, <1s
npm run build      # static dist/ for deployment
```

### Multiplayer Server (optional)

```bash
cd server
npm install
npm start          # WebSocket relay on port 8080
```

## Architecture

```
src/
├── core/              ← Pure TypeScript, NO Phaser imports (enforced by ESLint)
│   ├── Fraction.ts    ← Immutable rational arithmetic, reduced-equality engine
│   ├── Glass.ts       ← Aggregation + validateServe (equivalence acceptance)
│   ├── OrderGenerator ← Solvability-guaranteed orders (sum of available scoops)
│   ├── DifficultyMgr  ← Rolling-window adaptive promote/demote across 5 tiers
│   └── ScoreManager   ← Points, combo multiplier, time bonus, persistence
├── scenes/            ← Phaser scene lifecycle
├── objects/           ← Visual game objects (Glass, Customer, ScoopButton, Ticket)
├── art/               ← Programmatic texture generation (ArtGenerator)
├── audio/             ← Web Audio API synthesized sounds (zero audio files)
├── effects/           ← Particle + tween effects
├── ui/                ← HUD components (TimerBar, Hearts, ComboText, CoinCounter)
└── multiplayer/       ← WebSocket client for head-to-head mode
```

**Dependency rule:** `src/core/` is Phaser-free and fully unit-tested. All 216 tests run headless in <1 second. This separation means the math engine can be verified, iterated, and reused independently of the rendering layer.

**Data flow:** `GameScene` holds the core managers and current `GlassState`. Player input on a `ScoopButton` pushes a `Pour` and updates the visual `Glass`. Pressing **Serve** calls `validateServe()`, feeds a `PerfSample` to `DifficultyManager`, updates `ScoreManager`, and emits events the `HudScene` listens to via the Phaser event emitter.

## The Skill File (`skill.json`)

**All gameplay parameters are data-driven.** Changing grade band, theme, ingredients, session length, or difficulty curve requires **no code changes** — just edit `src/config/skill.json`.

The skill file defines:
- **Session mode**: endless (lives), fixed-count, or timed shift
- **Ingredients**: name, ID, and color (blended visually when poured)
- **5 difficulty tiers**: allowed denominators, ingredient count, scoop range, patience timers
- **Adaptive difficulty thresholds**: promote/demote accuracy, speed gating, window size

This is Phase 1 of the production pipeline: a serializable config that drives the entire game experience.

## AI-First Workflow

This project was built entirely using an **AI-first development workflow** with Claude Code:

1. **Spec → Plan**: The build specification was fed to Claude Code, which produced a milestone-based implementation plan (M0–M9) with acceptance criteria per phase.

2. **Core engine (test-first)**: The pure-TypeScript math engine (`Fraction`, `Glass`, `OrderGenerator`, `DifficultyManager`, `ScoreManager`) was developed test-first with 216 Vitest cases covering equivalence, solvability invariants, and adaptive difficulty behavior.

3. **Programmatic art generation**: All visual assets are generated via Phaser's Graphics API in `src/art/ArtGenerator.ts` — no external AI image tools required. Techniques include layered gradients, geometry masking for liquid rendering, and shape composition for characters.

4. **Synthesized audio**: All game sounds are created at runtime using the Web Audio API (`src/audio/SoundSynth.ts`) — oscillators, filtered noise, and envelopes produce taps, pours, chimes, and buzzes with zero audio file dependencies.

5. **Iterative assembly**: Each milestone was built, tested (`npm test` + `npm run lint`), and committed with conventional-commit messages before proceeding.

See `public/assets/assets.md` for the complete asset manifest documenting every programmatic texture and audio synthesis technique.

## Adaptive Difficulty

| Tier | Grade | Denominators | Ingredients | Mixed Numbers | Patience | Teaches |
|------|-------|-------------|-------------|---------------|----------|---------|
| T1 | Gr 3 | {2, 3, 4} | 1 | No | 14s | Count unit fractions |
| T2 | Gr 3–4 | {2, 3, 4, 6} | 1 | No | 12s | Equivalence |
| T3 | Gr 4–5 | {2, 3, 4, 6} | 1 | No | 11s | Unlike denominators |
| T4 | Gr 5 | {2, 3, 4, 6, 8} | 1–2 | Yes | 10s | Multi-ingredient + mixed |
| T5 | Gr 5–6 | {2, 3, 4, 6, 8} | 2–3 | Yes | 9s | Simplify under pressure |

The `DifficultyManager` uses a rolling window of 5 recent orders. Promote when ≥80% correct and average serve time ≤6s. Demote when ≤40% correct. Window clears on tier change.

## Multiplayer

Head-to-head mode uses a lightweight WebSocket relay server (`server/index.ts`):
- **Create/Join**: One player creates a room (gets a 4-character code), the other joins
- **Shared seed**: Both players receive the same RNG seed → identical order sequences
- **Race format**: First correct serve wins each round. Best of 5 rounds wins the match
- **Real-time sync**: Pour and serve events are relayed so players see opponent progress

The data model is serializable — `GlassState` is a plain array of `Pour` objects, `Order` is plain data. This architecture supports future scaling to persistent lobbies, ranked matchmaking, or spectator modes.

## Tech Stack

- **Phaser 3** — game engine (WebGL renderer, Scale.FIT for responsive)
- **TypeScript** — strict mode, no `any`
- **Vite** — instant HMR, static build output
- **Vitest** — fast headless tests for `core/`
- **ESLint + Prettier** — enforced code style + Phaser import ban in `core/`
- **Web Audio API** — runtime sound synthesis
- **WebSocket (ws)** — multiplayer relay server

## Testing

```bash
npm test           # 216 tests in <1s
```

Coverage areas:
- **Fraction**: arithmetic, reduction, equivalence (`1/2 == 2/4 == 3/6`), display, edge cases
- **OrderGenerator**: solvability invariant across 30 seeds × 5 tiers (150 property tests)
- **DifficultyManager**: promote/demote logic, bounds, window clearing, hint flags
- **ScoreManager**: combo multiplier math, time bonus monotonicity, persistence
- **Glass**: aggregation, all 5 ServeResult types, multi-ingredient validation

## Deploy

```bash
npm run build      # produces dist/
# Deploy dist/ to Vercel, Netlify, or itch.io
```

The game is fully offline-playable after initial load. No network calls in single-player mode.

## Future

- **Theme swaps via skill.json**: pizza-fractions counter, plating station — no code change
- **Placement mini-test**: determine opening tier from initial assessment
- **Daily challenge seed**: deterministic via the seeded RNG
- **Accessibility**: colorblind-safe ingredient patterns + larger-text mode
- **Multiplayer scaling**: persistent lobbies, ranked matchmaking, spectator mode

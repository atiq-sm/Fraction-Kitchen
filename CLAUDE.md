# Fraction Kitchen — Working Agreement

## Code Standards
- TypeScript strict; no `any`. ES modules, named exports, small single-responsibility files (<~200 lines).
- **Dependency rule (enforced via ESLint):** `src/core/` and `src/config/` must NOT import Phaser. Phaser only in `main.ts`, `scenes/`, `objects/`, `ui/`, `art/`, `effects/`.
- `Fraction` is immutable; all `core/` logic is pure and unit-tested.
- Config over magic numbers: gameplay/math values come from `skill.json` or `config/constants.ts`.

## Build & Test
- `npm run dev` — start dev server
- `npm run build` — production build to `dist/`
- `npm test` — run Vitest (core/ tests only, headless)
- `npm run lint` — ESLint check

## Architecture
- `src/core/` — Pure TypeScript math engine (Fraction, Glass, OrderGenerator, DifficultyManager, ScoreManager)
- `src/scenes/` — Phaser scenes (Boot, Preload, Menu, Game, HUD, Results, Lobby)
- `src/objects/` — Visual game objects (GlassVisual, ScoopButton, Ticket, Customer)
- `src/art/` — Programmatic texture generation (ArtGenerator)
- `src/audio/` — Web Audio API synthesized sounds (SoundSynth)
- `src/effects/` — Particle and tween effects (ParticleManager)
- `src/ui/` — HUD components (TimerBar, Hearts, ComboText, CoinCounter)
- `server/` — WebSocket multiplayer relay server

## Conventions
- Object-pool particles and frequently spawned objects
- Scene communication via event emitter / registry, not cross-scene direct references
- No network calls in single-player; localStorage only for persistence
- Conventional commits per milestone

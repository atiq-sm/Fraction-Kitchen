# Fraction Kitchen — Asset Manifest

All visual assets are **programmatically generated** using Phaser's Graphics API in `src/art/ArtGenerator.ts`. No external AI image tools were used. Each asset is drawn with code and cached as a texture via `generateTexture()`.

## Generated Textures

| Texture Key | Description | Technique |
|-------------|-------------|-----------|
| `bg` | Full 1280×720 background: mango→peach gradient sky, sun glow, shelf silhouettes, wood counter with grain | `fillGradientStyle()`, layered `fillRect`, decorative circles |
| `customer_{0-4}_happy` | 5 unique happy customer variants with different body colors, hair styles, expressions | Circle head + rounded rect body + arc mouth + dot eyes with highlights |
| `customer_{0-4}_sad` | 5 unique sad customer variants | Same as happy with inverted mouth arc |
| `droplet` | 16×16 white droplet particle | Filled circle with highlight |
| `confetti_{0-5}` | 6 color variants of confetti pieces | Rounded rectangles with highlight strips |
| `sparkle` | 16×16 sparkle/star particle | Cross pattern with glow |
| `coin` | 32×32 gold coin with "F" emboss | Layered circles, gradient, embossed letter |
| `heart` | 32×32 glossy heart icon | Two overlapping circles + triangle, highlight |
| `star` | 32×32 gold star | 5-point star via trigonometric path |

## Inline Graphics (not cached as textures)

| Element | Location | Technique |
|---------|----------|-----------|
| Glass (back/front) | `GlassVisual.ts` | Rounded rect with blue tint fill, ink outline, white highlight strips, rim ellipse |
| Liquid fill | `GlassVisual.ts` | Graphics rectangle masked with GeometryMask, color-blended via weighted RGB average |
| Target line | `GlassVisual.ts` | Dashed line segments + fraction label chip |
| Scoop buttons | `ScoopButton.ts` | Rounded rects with ingredient-color gradient, 3px ink outline, stacked shadow |
| Ticket card | `Ticket.ts` | Rounded rect with cream fill, accent header stripe, ink border |
| Timer bar | `TimerBar.ts` | Rounded rect with green→amber→red color lerp, pulse animation |
| UI panels | Various scenes | Rounded rects with cream fill, drop shadows, accent stripes |

## Audio Assets

All sounds are **synthesized at runtime** using the Web Audio API in `src/audio/SoundSynth.ts`. Zero audio files required.

| Sound | Technique |
|-------|-----------|
| Tap | Sine wave 800Hz, 50ms, quick envelope |
| Pour | Bandpass-filtered white noise at 2.2kHz, 180ms |
| Success chime | Three-tone arpeggio (C5-E5-G5), pitch scales with combo |
| Error buzz | Square wave 180→100Hz descending, 200ms |
| Heart loss | Low sine thud 80Hz + 60Hz, 120ms |
| Level up | Ascending arpeggio C5-E5-G5-C6, 60ms per tone |
| Combo blip | Sine wave, frequency based on combo count |
| Dump | Filtered white noise at 800Hz, 250ms |

## Design Philosophy

The "Sunny Hand-Crafted Juice Bar" aesthetic is achieved through:
1. **Warm gradient palette** — mango-to-peach sky, wood counter tones
2. **Bold 3-4px ink outlines** on all interactive elements
3. **Layered depth** — every object has fill + outline + highlight (3 layers minimum)
4. **Rounded everything** — `fillRoundedRect()` with 8-16px radius throughout
5. **Consistent typography** — Fredoka (display) + Nunito (body), never system fonts
6. **Juice on every interaction** — tweens, particles, camera punches, synthesized SFX

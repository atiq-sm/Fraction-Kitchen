export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

export const COLORS = {
  bgTop: 0xffd8a8,
  bgBottom: 0xffb088,
  cream: 0xfff4e0,
  surface: 0xfffdf7,
  ink: 0x3a2e39,
  accent: 0xff5e5b,
  mint: 0x3cb371,
  mango: 0xffb703,
  berry: 0xff4d6d,
  blue: 0x5b6cff,
  wood: 0x8b6914,
  woodDark: 0x6b4f14,
  woodLight: 0xa67c2e,
} as const;

export const COLORS_HEX = {
  bgTop: '#FFD8A8',
  bgBottom: '#FFB088',
  cream: '#FFF4E0',
  surface: '#FFFDF7',
  ink: '#3A2E39',
  accent: '#FF5E5B',
  mint: '#3CB371',
  mango: '#FFB703',
  berry: '#FF4D6D',
  blue: '#5B6CFF',
} as const;

export const FONTS = {
  display: 'Fredoka, Arial Rounded MT Bold, sans-serif',
  body: 'Nunito, Quicksand, sans-serif',
} as const;

export const LAYOUT = {
  glass: { x: 480, y: 280, width: 200, height: 400 },
  customer: { x: 1150, y: 260 },
  ticket: { x: 1150, y: 540 },
  scoopPalette: { x: 960, y: 940, spacing: 140 },
  hud: {
    heartsX: 50, heartsY: 30,
    scoreX: 1870, scoreY: 30,
    timerY: 80,
  },
  serveButton: { x: 480, y: 800 },
  dumpButton: { x: 480, y: 870 },
} as const;

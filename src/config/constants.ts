export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

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
  glass: { x: 340, y: 200, width: 160, height: 300 },
  customer: { x: 780, y: 180 },
  ticket: { x: 780, y: 380 },
  scoopPalette: { x: 640, y: 620, spacing: 110 },
  hud: {
    heartsX: 40, heartsY: 20,
    scoreX: 1240, scoreY: 20,
    timerY: 60,
  },
  serveButton: { x: 340, y: 560 },
  dumpButton: { x: 340, y: 620 },
} as const;

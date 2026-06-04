export function hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

export function rgbToHex(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export function hexStringToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function blendColors(
  colorA: number,
  weightA: number,
  colorB: number,
  weightB: number,
): number {
  const totalWeight = weightA + weightB;
  if (totalWeight === 0) return colorA;

  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  const r = Math.round((a.r * weightA + b.r * weightB) / totalWeight);
  const g = Math.round((a.g * weightA + b.g * weightB) / totalWeight);
  const bl = Math.round((a.b * weightA + b.b * weightB) / totalWeight);

  return rgbToHex(r, g, bl);
}

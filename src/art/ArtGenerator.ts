import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

const W = GAME_WIDTH;
const H = GAME_HEIGHT;
const COUNTER_Y = Math.round(H * 0.75);

export class ArtGenerator {
  static generate(scene: Phaser.Scene) {
    ArtGenerator.generateBackground(scene);
    ArtGenerator.generateParticles(scene);
    ArtGenerator.generateCoin(scene);
    ArtGenerator.generateHeart(scene);
    ArtGenerator.generateCustomers(scene);
    ArtGenerator.generateStar(scene);
  }

  private static generateBackground(scene: Phaser.Scene) {
    const g = scene.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
    g.fillRect(0, 0, W, H);

    // Warm sun glow
    g.fillStyle(0xffe4b8, 0.3);
    g.fillCircle(W * 0.85, 80, 280);
    g.fillStyle(0xfff0d0, 0.2);
    g.fillCircle(W * 0.85, 80, 200);

    // Shelves on back wall
    g.fillStyle(COLORS.woodLight, 0.3);
    g.fillRect(W * 0.42, 140, W * 0.52, 10);
    g.fillRect(W * 0.46, 310, W * 0.46, 10);

    // Jar silhouettes
    const jarColors = [0xff4d6d, 0xffce45, 0x5b6cff, 0x3cb371];
    for (let i = 0; i < 4; i++) {
      const jx = W * 0.48 + i * 180;
      g.fillStyle(jarColors[i], 0.25);
      g.fillRoundedRect(jx, 70, 50, 65, 8);
      g.fillStyle(jarColors[i], 0.15);
      g.fillRoundedRect(jx + 10, 56, 30, 16, 5);
    }

    // Wood counter
    g.fillGradientStyle(0x8b6914, 0xa67c2e, 0x6b4f14, 0x8b6914);
    g.fillRect(0, COUNTER_Y, W, H - COUNTER_Y);

    // Counter edge highlight
    g.fillStyle(0xb8902e, 0.6);
    g.fillRect(0, COUNTER_Y, W, 8);
    g.fillStyle(0x5a3e10, 0.4);
    g.fillRect(0, COUNTER_Y + 8, W, 4);

    // Wood grain
    g.lineStyle(1, 0xa67c2e, 0.15);
    for (let i = 0; i < 12; i++) {
      const y = COUNTER_Y + 20 + i * 22;
      g.lineBetween(0, y, W, y);
    }

    // Counter front panel
    g.fillStyle(0x7a5c18, 0.3);
    g.fillRect(0, H - 100, W, 100);

    // Decorative dots along counter edge
    for (let i = 0; i < 28; i++) {
      g.fillStyle(0xc49932, 0.15);
      g.fillCircle(36 + i * 68, COUNTER_Y + 6, 5);
    }

    g.generateTexture('bg', W, H);
    g.destroy();
  }

  private static generateParticles(scene: Phaser.Scene) {
    const dg = scene.add.graphics();
    dg.fillStyle(0xffffff, 1);
    dg.fillCircle(8, 8, 6);
    dg.fillStyle(0xffffff, 0.5);
    dg.fillCircle(6, 6, 3);
    dg.generateTexture('droplet', 16, 16);
    dg.destroy();

    const confettiColors = [0xff5e5b, 0xffb703, 0x3cb371, 0x5b6cff, 0xff4d6d, 0xffce45];
    confettiColors.forEach((color, i) => {
      const cg = scene.add.graphics();
      cg.fillStyle(color, 1);
      cg.fillRoundedRect(2, 2, 12, 8, 2);
      cg.fillStyle(0xffffff, 0.3);
      cg.fillRoundedRect(3, 3, 10, 3, 1);
      cg.generateTexture(`confetti_${i}`, 16, 16);
      cg.destroy();
    });

    const sg = scene.add.graphics();
    sg.fillStyle(0xffffff, 1);
    sg.fillRect(6, 0, 4, 16);
    sg.fillRect(0, 6, 16, 4);
    sg.fillStyle(0xfff0d0, 0.8);
    sg.fillRect(7, 1, 2, 14);
    sg.fillRect(1, 7, 14, 2);
    sg.generateTexture('sparkle', 16, 16);
    sg.destroy();
  }

  private static generateCoin(scene: Phaser.Scene) {
    const g = scene.add.graphics();
    g.fillStyle(0x996600, 0.4);
    g.fillCircle(18, 19, 14);
    g.fillStyle(0xdaa520, 1);
    g.fillCircle(16, 16, 14);
    g.lineStyle(2, 0xb8860b, 0.7);
    g.strokeCircle(16, 16, 10);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(16, 14, 12);
    g.fillStyle(0xffeebb, 0.6);
    g.fillEllipse(14, 11, 10, 6);
    g.fillStyle(0xb8860b, 0.5);
    g.fillRect(13, 11, 2, 10);
    g.fillRect(13, 11, 7, 2);
    g.fillRect(13, 16, 5, 2);
    g.generateTexture('coin', 32, 32);
    g.destroy();
  }

  private static generateHeart(scene: Phaser.Scene) {
    const g = scene.add.graphics();
    g.fillStyle(0x8b0000, 0.3);
    g.fillCircle(11, 12, 7);
    g.fillCircle(21, 12, 7);
    g.fillStyle(0xff5e5b, 1);
    g.fillCircle(10, 11, 7);
    g.fillCircle(20, 11, 7);
    g.fillTriangle(3, 13, 27, 13, 15, 28);
    g.fillStyle(0xff8a88, 1);
    g.fillCircle(10, 10, 5);
    g.fillCircle(20, 10, 5);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(9, 8, 3);
    g.generateTexture('heart', 32, 32);
    g.destroy();
  }

  private static generateCustomers(scene: Phaser.Scene) {
    const bodyColors = [0xff7675, 0x74b9ff, 0x55efc4, 0xfdcb6e, 0xa29bfe];
    const hairColors = [0x2d3436, 0x6c5ce7, 0xe17055, 0xdfe6e9, 0xd63031];
    const hairStyles = ['spiky', 'round', 'flat', 'curly', 'tall'];

    for (let v = 0; v < 5; v++) {
      ['happy', 'sad'].forEach((mood) => {
        const g = scene.add.graphics();
        const cx = 60;
        const bodyColor = bodyColors[v];
        const hairColor = hairColors[v];

        g.fillStyle(0x000000, 0.1);
        g.fillRoundedRect(cx - 34, 62, 68, 62, 14);
        g.fillStyle(bodyColor, 1);
        g.fillRoundedRect(cx - 32, 58, 64, 60, 12);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(cx - 26, 60, 52, 24, { tl: 10, tr: 10, bl: 0, br: 0 });
        g.lineStyle(3, COLORS.ink, 0.7);
        g.strokeRoundedRect(cx - 32, 58, 64, 60, 12);

        g.fillStyle(0xfec89a, 1);
        g.fillCircle(cx, 38, 28);
        g.lineStyle(3, COLORS.ink, 0.6);
        g.strokeCircle(cx, 38, 28);

        g.fillStyle(hairColor, 1);
        switch (hairStyles[v]) {
          case 'spiky':
            for (let i = -2; i <= 2; i++)
              g.fillTriangle(cx + i * 10, 12, cx + i * 10 - 6, 26, cx + i * 10 + 6, 26);
            break;
          case 'round':
            g.fillEllipse(cx, 18, 56, 30);
            break;
          case 'flat':
            g.fillRoundedRect(cx - 28, 10, 56, 20, 10);
            break;
          case 'curly':
            for (let i = -2; i <= 2; i++) g.fillCircle(cx + i * 11, 16, 10);
            break;
          case 'tall':
            g.fillRoundedRect(cx - 20, 2, 40, 30, 10);
            break;
        }

        g.fillStyle(0xffffff, 1);
        g.fillCircle(cx - 10, 36, 6);
        g.fillCircle(cx + 10, 36, 6);
        g.fillStyle(COLORS.ink, 1);
        g.fillCircle(cx - 9, 37, 3);
        g.fillCircle(cx + 11, 37, 3);
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(cx - 8, 35, 1.5);
        g.fillCircle(cx + 12, 35, 1.5);

        g.fillStyle(0xffb6c1, 0.35);
        g.fillEllipse(cx - 18, 44, 10, 6);
        g.fillEllipse(cx + 18, 44, 10, 6);

        if (mood === 'happy') {
          g.lineStyle(2.5, COLORS.ink, 0.8);
          g.beginPath();
          g.arc(cx, 46, 8, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170));
          g.strokePath();
        } else {
          g.lineStyle(2.5, COLORS.ink, 0.8);
          g.beginPath();
          g.arc(cx, 54, 8, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(350));
          g.strokePath();
        }

        g.generateTexture(`customer_${v}_${mood}`, 120, 120);
        g.destroy();
      });
    }
  }

  private static generateStar(scene: Phaser.Scene) {
    const g = scene.add.graphics();
    g.fillStyle(0xffd700, 1);
    const cx = 16,
      cy = 16,
      r = 14,
      ir = 6;
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = angle + Math.PI / 5;
      g.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      g.lineTo(cx + Math.cos(innerAngle) * ir, cy + Math.sin(innerAngle) * ir);
    }
    g.closePath();
    g.fillPath();
    g.fillStyle(0xfff0a0, 0.5);
    g.fillCircle(14, 12, 5);
    g.generateTexture('star', 32, 32);
    g.destroy();
  }
}

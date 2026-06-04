import Phaser from 'phaser';
import { Fraction } from '../core/Fraction';
import { COLORS, FONTS } from '../config/constants';
import { hexStringToNumber } from '../utils/ColorUtils';

const BTN_SIZE = 96;
const FRACTION_LABELS: Record<number, string> = {
  2: '½',
  3: '⅓',
  4: '¼',
  6: '⅙',
  8: '⅛',
};

export class ScoopButton extends Phaser.GameObjects.Container {
  readonly fraction: Fraction;
  readonly ingredientId: string;
  private bg: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    denominator: number,
    ingredientId: string,
    ingredientColor: string,
  ) {
    super(scene, x, y);
    this.fraction = new Fraction(1, denominator);
    this.ingredientId = ingredientId;

    const color = hexStringToNumber(ingredientColor);

    this.bg = scene.add.graphics();
    // Shadow
    this.bg.fillStyle(COLORS.ink, 0.15);
    this.bg.fillRoundedRect(-BTN_SIZE / 2 + 3, -BTN_SIZE / 2 + 3, BTN_SIZE, BTN_SIZE, 16);
    // Main button
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-BTN_SIZE / 2, -BTN_SIZE / 2, BTN_SIZE, BTN_SIZE, 16);
    // Highlight
    this.bg.fillStyle(0xffffff, 0.25);
    this.bg.fillRoundedRect(
      -BTN_SIZE / 2 + 6,
      -BTN_SIZE / 2 + 6,
      BTN_SIZE - 12,
      BTN_SIZE / 2 - 6,
      { tl: 10, tr: 10, bl: 0, br: 0 },
    );
    // Border
    this.bg.lineStyle(3, COLORS.ink, 0.9);
    this.bg.strokeRoundedRect(-BTN_SIZE / 2, -BTN_SIZE / 2, BTN_SIZE, BTN_SIZE, 16);

    this.add(this.bg);

    const label = FRACTION_LABELS[denominator] || `1/${denominator}`;
    const text = scene.add
      .text(0, -4, label, {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.add(text);

    const fractionText = scene.add
      .text(0, BTN_SIZE / 2 - 16, `1/${denominator}`, {
        fontFamily: FONTS.body,
        fontSize: '14px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.add(fractionText);

    this.setSize(BTN_SIZE, BTN_SIZE);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerdown', () => {
      scene.tweens.add({
        targets: this,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 60,
        yoyo: true,
        ease: 'Back.easeOut',
        onYoyo: () => {
          scene.tweens.add({
            targets: this,
            scaleX: 1.06,
            scaleY: 1.06,
            duration: 40,
            yoyo: true,
            ease: 'Sine.easeOut',
          });
        },
      });
    });

    scene.add.existing(this);
  }
}

import Phaser from 'phaser';
import { Fraction } from '../core/Fraction';
import { COLORS, FONTS } from '../config/constants';
import { blendColors, hexStringToNumber } from '../utils/ColorUtils';
import type { GlassState } from '../core/types';
import type { Ingredient } from '../core/types';

const GLASS_WIDTH = 140;
const GLASS_HEIGHT = 280;
const GLASS_WALL = 6;
const LIQUID_INSET = 10;

export class GlassVisual extends Phaser.GameObjects.Container {
  private glassBack: Phaser.GameObjects.Graphics;
  private liquidGraphics: Phaser.GameObjects.Graphics;
  private glassFront: Phaser.GameObjects.Graphics;
  private targetLine: Phaser.GameObjects.Graphics;
  private totalText: Phaser.GameObjects.Text;
  private targetText: Phaser.GameObjects.Text;
  private wobbleEllipse: Phaser.GameObjects.Ellipse | null = null;

  private fillLevel = 0;
  private liquidColor = 0xffaaaa;
  private capacityCups: number;
  private ingredients: Ingredient[];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    capacityCups: number,
    ingredients: Ingredient[],
  ) {
    super(scene, x, y);
    this.capacityCups = capacityCups;
    this.ingredients = ingredients;

    // Glass back/front are container children (local coords)
    this.glassBack = scene.add.graphics();
    this.glassFront = scene.add.graphics();
    this.targetLine = scene.add.graphics();
    this.add([this.glassBack, this.targetLine, this.glassFront]);

    // Liquid is a SCENE-LEVEL object (world coords) — keeps mask alignment simple
    this.liquidGraphics = scene.add.graphics();
    this.liquidGraphics.setDepth(this.depth);

    this.totalText = scene.add
      .text(0, GLASS_HEIGHT / 2 + 24, '0', {
        fontFamily: FONTS.display,
        fontSize: '28px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);
    this.add(this.totalText);

    this.targetText = scene.add
      .text(GLASS_WIDTH / 2 + 30, 0, '', {
        fontFamily: FONTS.body,
        fontSize: '18px',
        color: '#FF5E5B',
        backgroundColor: '#FFF4E0',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0, 0.5);
    this.add(this.targetText);

    this.drawGlass();
    this.setupMask();

    scene.add.existing(this);
  }

  private drawGlass() {
    const hw = GLASS_WIDTH / 2;
    const hh = GLASS_HEIGHT / 2;

    this.glassBack.fillStyle(0xddeeff, 0.15);
    this.glassBack.fillRoundedRect(-hw, -hh, GLASS_WIDTH, GLASS_HEIGHT, 12);

    this.glassBack.lineStyle(GLASS_WALL, COLORS.ink, 0.8);
    this.glassBack.strokeRoundedRect(-hw, -hh, GLASS_WIDTH, GLASS_HEIGHT, 12);

    this.glassBack.fillStyle(COLORS.ink, 0.15);
    this.glassBack.fillRoundedRect(-hw + 4, hh - 12, GLASS_WIDTH - 8, 12, {
      bl: 8,
      br: 8,
      tl: 0,
      tr: 0,
    });

    this.glassFront.fillStyle(0xffffff, 0.2);
    this.glassFront.fillRoundedRect(-hw + 12, -hh + 16, 14, GLASS_HEIGHT - 60, 7);
    this.glassFront.fillStyle(0xffffff, 0.12);
    this.glassFront.fillRoundedRect(-hw + 30, -hh + 24, 8, GLASS_HEIGHT - 80, 4);

    this.glassFront.fillStyle(0xffffff, 0.3);
    this.glassFront.fillEllipse(0, -hh + 4, GLASS_WIDTH - 20, 10);
  }

  private setupMask() {
    const maskGraphics = this.scene.add.graphics();
    const hw = GLASS_WIDTH / 2;
    const hh = GLASS_HEIGHT / 2;
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRoundedRect(
      this.x - hw + LIQUID_INSET,
      this.y - hh + LIQUID_INSET,
      GLASS_WIDTH - LIQUID_INSET * 2,
      GLASS_HEIGHT - LIQUID_INSET * 2,
      8,
    );
    maskGraphics.setVisible(false);

    const mask = new Phaser.Display.Masks.GeometryMask(this.scene, maskGraphics);
    this.liquidGraphics.setMask(mask);
  }

  setTarget(target: Fraction) {
    this.targetLine.clear();

    const hw = GLASS_WIDTH / 2;
    const hh = GLASS_HEIGHT / 2;
    const targetFill = target.value() / this.capacityCups;
    const lineY = hh - targetFill * (GLASS_HEIGHT - LIQUID_INSET * 2) - LIQUID_INSET;

    this.targetLine.lineStyle(2, COLORS.accent, 0.7);
    const dashLen = 8;
    const gapLen = 6;
    let dx = -hw + LIQUID_INSET;
    while (dx < hw - LIQUID_INSET) {
      this.targetLine.lineBetween(dx, lineY, Math.min(dx + dashLen, hw - LIQUID_INSET), lineY);
      dx += dashLen + gapLen;
    }

    this.targetText.setY(lineY);
    this.targetText.setText(target.toMixedString());
  }

  updateFromState(glass: GlassState) {
    let total = Fraction.zero();
    const colorWeights: Array<{ color: number; weight: number }> = [];

    for (const pour of glass) {
      total = total.add(pour.amount);
      const ing = this.ingredients.find((i) => i.id === pour.ingredientId);
      if (ing) {
        colorWeights.push({
          color: hexStringToNumber(ing.colorHex),
          weight: pour.amount.value(),
        });
      }
    }

    if (colorWeights.length > 0) {
      let blended = colorWeights[0].color;
      let totalWeight = colorWeights[0].weight;
      for (let i = 1; i < colorWeights.length; i++) {
        blended = blendColors(blended, totalWeight, colorWeights[i].color, colorWeights[i].weight);
        totalWeight += colorWeights[i].weight;
      }
      this.liquidColor = blended;
    }

    const newFill = total.value() / this.capacityCups;
    this.animateFill(newFill);
    this.totalText.setText(total.isZero() ? '0' : total.toMixedString());
  }

  private animateFill(targetLevel: number) {
    this.scene.tweens.add({
      targets: this,
      fillLevel: targetLevel,
      duration: 250,
      ease: 'Back.easeOut',
      onUpdate: () => this.drawLiquid(),
    });
  }

  private drawLiquid() {
    this.liquidGraphics.clear();
    if (this.fillLevel <= 0) return;

    const hw = GLASS_WIDTH / 2;
    const hh = GLASS_HEIGHT / 2;
    const innerH = GLASS_HEIGHT - LIQUID_INSET * 2;
    const liquidHeight = this.fillLevel * innerH;
    const liquidBottom = this.y + hh - LIQUID_INSET;
    const liquidTop = liquidBottom - liquidHeight;

    // World coords since liquidGraphics is scene-level
    this.liquidGraphics.fillStyle(this.liquidColor, 0.85);
    this.liquidGraphics.fillRect(
      this.x - hw + LIQUID_INSET,
      liquidTop,
      GLASS_WIDTH - LIQUID_INSET * 2,
      liquidHeight,
    );

    // Surface highlight
    this.liquidGraphics.fillStyle(0xffffff, 0.25);
    this.liquidGraphics.fillEllipse(this.x, liquidTop, GLASS_WIDTH - LIQUID_INSET * 2 - 10, 8);
  }

  resetGlass() {
    this.fillLevel = 0;
    this.liquidGraphics.clear();
    this.totalText.setText('0');
    this.targetLine.clear();
    this.targetText.setText('');
  }

  doWobble() {
    if (this.wobbleEllipse) this.wobbleEllipse.destroy();

    const hh = GLASS_HEIGHT / 2;
    const liquidHeight = this.fillLevel * (GLASS_HEIGHT - LIQUID_INSET * 2);
    const liquidTop = hh - LIQUID_INSET - liquidHeight;

    this.wobbleEllipse = this.scene.add.ellipse(
      0,
      liquidTop,
      GLASS_WIDTH - LIQUID_INSET * 2 - 10,
      12,
      this.liquidColor,
      0.4,
    );
    this.add(this.wobbleEllipse);

    this.scene.tweens.add({
      targets: this.wobbleEllipse,
      scaleY: 0.3,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.wobbleEllipse) {
          this.wobbleEllipse.destroy();
          this.wobbleEllipse = null;
        }
      },
    });
  }

  getGlassWorldBounds() {
    return {
      x: this.x - GLASS_WIDTH / 2,
      y: this.y - GLASS_HEIGHT / 2,
      width: GLASS_WIDTH,
      height: GLASS_HEIGHT,
    };
  }

  destroy(fromScene?: boolean) {
    this.liquidGraphics.destroy();
    super.destroy(fromScene);
  }
}

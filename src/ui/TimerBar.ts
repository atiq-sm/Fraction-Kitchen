import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config/constants';

const BAR_WIDTH = GAME_WIDTH - 100;
const BAR_HEIGHT = 16;
const BAR_X = 50;
const BAR_Y = 78;

export class TimerBar extends Phaser.GameObjects.Container {
  private barBg: Phaser.GameObjects.Graphics;
  private barFill: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.barBg = scene.add.graphics();
    this.barBg.fillStyle(COLORS.ink, 0.15);
    this.barBg.fillRoundedRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 8);
    this.add(this.barBg);

    this.barFill = scene.add.graphics();
    this.add(this.barFill);

    scene.add.existing(this);
  }

  update(remaining: number, total: number) {
    const progress = Math.max(0, remaining / total);
    this.barFill.clear();

    let color: number;
    if (progress > 0.5) {
      color = COLORS.mint;
    } else if (progress > 0.25) {
      color = COLORS.mango;
    } else {
      color = COLORS.accent;
    }

    this.barFill.fillStyle(color, 1);
    this.barFill.fillRoundedRect(BAR_X, BAR_Y, BAR_WIDTH * progress, BAR_HEIGHT, 8);

    if (progress < 0.25) {
      const pulseScale = 1 + Math.sin(Date.now() / 150) * 0.03;
      this.barFill.setScale(pulseScale, 1);
    } else {
      this.barFill.setScale(1, 1);
    }
  }
}

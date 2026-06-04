import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config/constants';

const BAR_WIDTH = GAME_WIDTH - 80;
const BAR_HEIGHT = 14;
const BAR_X = 40;
const BAR_Y = 58;

export class TimerBar extends Phaser.GameObjects.Container {
  private barBg: Phaser.GameObjects.Graphics;
  private barFill: Phaser.GameObjects.Graphics;
  private progress = 1;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.barBg = scene.add.graphics();
    this.barBg.fillStyle(COLORS.ink, 0.15);
    this.barBg.fillRoundedRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT, 7);
    this.add(this.barBg);

    this.barFill = scene.add.graphics();
    this.add(this.barFill);

    scene.add.existing(this);
  }

  update(remaining: number, total: number) {
    this.progress = Math.max(0, remaining / total);
    this.barFill.clear();

    let color: number;
    if (this.progress > 0.5) {
      color = COLORS.mint;
    } else if (this.progress > 0.25) {
      color = COLORS.mango;
    } else {
      color = COLORS.accent;
    }

    this.barFill.fillStyle(color, 1);
    this.barFill.fillRoundedRect(BAR_X, BAR_Y, BAR_WIDTH * this.progress, BAR_HEIGHT, 7);

    if (this.progress < 0.25) {
      const pulseScale = 1 + Math.sin(Date.now() / 150) * 0.03;
      this.barFill.setScale(pulseScale, 1);
    } else {
      this.barFill.setScale(1, 1);
    }
  }
}

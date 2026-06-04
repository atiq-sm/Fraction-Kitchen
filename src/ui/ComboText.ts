import Phaser from 'phaser';
import { FONTS } from '../config/constants';

export class ComboText {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }

  show(combo: number) {
    if (combo < 2) return;

    const text = this.scene.add
      .text(this.x, this.y, `x${combo}!`, {
        fontFamily: FONTS.display,
        fontSize: '42px',
        color: '#FFB703',
        stroke: '#3A2E39',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(90);

    this.scene.tweens.add({
      targets: text,
      y: this.y - 60,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 900,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }
}

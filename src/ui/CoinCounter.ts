import Phaser from 'phaser';
import { FONTS } from '../config/constants';

export class CoinCounter extends Phaser.GameObjects.Container {
  private coinText: Phaser.GameObjects.Text;
  private coinIcon: Phaser.GameObjects.Graphics;
  private displayValue = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.coinIcon = scene.add.graphics();
    this.coinIcon.fillStyle(0xffb703, 1);
    this.coinIcon.fillCircle(-20, 0, 12);
    this.coinIcon.fillStyle(0xffd166, 1);
    this.coinIcon.fillCircle(-20, -2, 10);
    this.coinIcon.lineStyle(2, 0x3a2e39, 0.6);
    this.coinIcon.strokeCircle(-20, -1, 12);
    this.add(this.coinIcon);

    this.coinText = scene.add
      .text(0, 0, '0', {
        fontFamily: FONTS.display,
        fontSize: '24px',
        color: '#FFB703',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0, 0.5);
    this.add(this.coinText);

    scene.add.existing(this);
  }

  setCoins(n: number) {
    if (n > this.displayValue) {
      this.scene.tweens.add({
        targets: this.coinIcon,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    }
    this.displayValue = n;
    this.coinText.setText(String(n));
  }
}

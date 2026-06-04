import Phaser from 'phaser';
import { FONTS } from '../config/constants';

export class Hearts extends Phaser.GameObjects.Container {
  private heartTexts: Phaser.GameObjects.Text[] = [];
  private maxLives: number;

  constructor(scene: Phaser.Scene, x: number, y: number, maxLives: number) {
    super(scene, x, y);
    this.maxLives = maxLives;

    for (let i = 0; i < maxLives; i++) {
      const heart = scene.add
        .text(i * 40, 0, '❤', {
          fontFamily: FONTS.display,
          fontSize: '32px',
          color: '#FF5E5B',
        })
        .setOrigin(0, 0.5);
      this.heartTexts.push(heart);
      this.add(heart);
    }

    scene.add.existing(this);
  }

  setLives(n: number) {
    for (let i = 0; i < this.maxLives; i++) {
      if (i < n) {
        this.heartTexts[i].setAlpha(1).setScale(1);
      } else {
        this.heartTexts[i].setAlpha(0.2).setScale(0.8);
      }
    }
  }

  loseHeart(fromLives: number) {
    const idx = fromLives;
    if (idx >= 0 && idx < this.maxLives) {
      const heart = this.heartTexts[idx];
      this.scene.tweens.add({
        targets: heart,
        alpha: 0.2,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          heart.setScale(0.8);
        },
      });
    }
  }
}

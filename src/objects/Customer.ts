import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';

export class Customer extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private variant: number;
  private idleTween: Phaser.Tweens.Tween | null = null;
  private homeX: number;
  private homeY: number;
  private lastVariant = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.homeX = x;
    this.homeY = y;

    this.variant = Phaser.Math.Between(0, 4);
    this.sprite = scene.add.image(0, 0, `customer_${this.variant}_happy`);
    this.sprite.setScale(1.8);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  arrive() {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }

    // Pick a different variant than last time
    let newVariant: number;
    do {
      newVariant = Phaser.Math.Between(0, 4);
    } while (newVariant === this.lastVariant);
    this.variant = newVariant;
    this.lastVariant = newVariant;

    this.sprite.setTexture(`customer_${this.variant}_happy`);
    this.setPosition(GAME_WIDTH + 100, this.homeY);
    this.setAlpha(1);
    this.setScale(1);

    this.scene.tweens.add({
      targets: this,
      x: this.homeX,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => this.startIdleBob(),
    });
  }

  private startIdleBob() {
    if (this.idleTween) this.idleTween.stop();
    this.idleTween = this.scene.tweens.add({
      targets: this,
      y: this.homeY - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  setHappy() {
    this.sprite.setTexture(`customer_${this.variant}_happy`);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  setSad() {
    this.sprite.setTexture(`customer_${this.variant}_sad`);
    this.scene.tweens.add({
      targets: this,
      x: this.x + 6,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
  }

  leave() {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }
    this.scene.tweens.add({
      targets: this,
      x: -200,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
    });
  }

  destroy(fromScene?: boolean) {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }
    super.destroy(fromScene);
  }
}

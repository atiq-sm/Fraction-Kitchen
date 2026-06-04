import Phaser from 'phaser';

export class Customer extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private variant: number;
  private idleTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.variant = Phaser.Math.Between(0, 4);
    this.sprite = scene.add.image(0, 0, `customer_${this.variant}_happy`);
    this.sprite.setScale(1.4);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  arrive() {
    this.setX(1400);
    this.setAlpha(1);
    this.variant = Phaser.Math.Between(0, 4);
    this.sprite.setTexture(`customer_${this.variant}_happy`);

    this.scene.tweens.add({
      targets: this,
      x: this.scene.registry.get('customerX') || 780,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => this.startIdleBob(),
    });
  }

  private startIdleBob() {
    if (this.idleTween) this.idleTween.stop();
    this.idleTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 6,
      duration: 1000,
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
      x: this.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
  }

  leave() {
    if (this.idleTween) this.idleTween.stop();
    this.scene.tweens.add({
      targets: this,
      x: -200,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
    });
  }

  destroy(fromScene?: boolean) {
    if (this.idleTween) this.idleTween.stop();
    super.destroy(fromScene);
  }
}

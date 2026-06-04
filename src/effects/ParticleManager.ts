import Phaser from 'phaser';

export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  emitPourDroplets(x: number, y: number, color: number) {
    const count = Phaser.Math.Between(8, 14);
    for (let i = 0; i < count; i++) {
      const droplet = this.scene.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y,
        Phaser.Math.Between(2, 5),
        color,
        0.8,
      );
      droplet.setDepth(80);

      this.scene.tweens.add({
        targets: droplet,
        x: droplet.x + Phaser.Math.Between(-30, 30),
        y: droplet.y + Phaser.Math.Between(20, 80),
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: Phaser.Math.Between(300, 500),
        ease: 'Power2',
        onComplete: () => droplet.destroy(),
      });
    }
  }

  emitConfetti(x: number, y: number) {
    const count = Phaser.Math.Between(20, 30);
    const colors = [0xff5e5b, 0xffb703, 0x3cb371, 0x5b6cff, 0xff4d6d, 0xffce45];

    for (let i = 0; i < count; i++) {
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const piece = this.scene.add
        .rectangle(x, y, Phaser.Math.Between(6, 12), Phaser.Math.Between(4, 8), color)
        .setDepth(100);

      this.scene.tweens.add({
        targets: piece,
        x: x + Phaser.Math.Between(-180, 180),
        y: y + Phaser.Math.Between(-200, 60),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: Phaser.Math.Between(800, 1400),
        ease: 'Power1',
        delay: Phaser.Math.Between(0, 100),
        onComplete: () => piece.destroy(),
      });
    }
  }

  emitCoinFly(fromX: number, fromY: number, toX: number, toY: number, count: number) {
    for (let i = 0; i < count; i++) {
      const coin = this.scene.add.circle(
        fromX + Phaser.Math.Between(-10, 10),
        fromY,
        6,
        0xffb703,
      );
      coin.setDepth(95);

      const midX = (fromX + toX) / 2 + Phaser.Math.Between(-60, 60);
      const midY = Math.min(fromY, toY) - Phaser.Math.Between(40, 100);

      this.scene.tweens.add({
        targets: coin,
        x: { value: midX, duration: 200, ease: 'Sine.easeOut' },
        y: { value: midY, duration: 200, ease: 'Sine.easeOut' },
        delay: i * 60,
        onComplete: () => {
          this.scene.tweens.add({
            targets: coin,
            x: toX,
            y: toY,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0.7,
            duration: 300,
            ease: 'Power2',
            onComplete: () => coin.destroy(),
          });
        },
      });
    }
  }

  emitSpill(x: number, y: number) {
    const count = Phaser.Math.Between(6, 10);
    for (let i = 0; i < count; i++) {
      const drop = this.scene.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y,
        Phaser.Math.Between(3, 7),
        0xff5e5b,
        0.7,
      );
      drop.setDepth(80);

      this.scene.tweens.add({
        targets: drop,
        y: y + Phaser.Math.Between(40, 120),
        x: drop.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: Phaser.Math.Between(400, 700),
        ease: 'Power2',
        onComplete: () => drop.destroy(),
      });
    }
  }

  emitSparkle(x: number, y: number) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = Phaser.Math.Between(30, 70);
      const star = this.scene.add.star(
        x,
        y,
        4,
        2,
        6,
        0xffd700,
        0.9,
      ).setDepth(110);

      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(400, 700),
        delay: Phaser.Math.Between(0, 150),
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { playTap, playLevelUp } from '../audio/SoundSynth';
import { ParticleManager } from '../effects/ParticleManager';

interface ResultsData {
  score: number;
  bestScore: number;
  tier: number;
  customers: number;
  coins: number;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  create(data: ResultsData) {
    const cx = GAME_WIDTH / 2;
    const particles = new ParticleManager(this);

    // Background
    if (this.textures.exists('bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg').setAlpha(0.5);
    }
    const overlay = this.add.graphics();
    overlay.fillStyle(COLORS.ink, 0.3);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel with slide-in
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.96);
    panel.fillRoundedRect(cx - 260, 60, 520, 520, 20);
    panel.lineStyle(4, COLORS.ink, 0.6);
    panel.strokeRoundedRect(cx - 260, 60, 520, 520, 20);

    // Accent stripe top
    panel.fillStyle(COLORS.accent, 0.9);
    panel.fillRoundedRect(cx - 260, 60, 520, 50, { tl: 20, tr: 20, bl: 0, br: 0 });

    this.cameras.main.fadeIn(400);

    // Title
    this.add
      .text(cx, 85, 'GAME OVER', {
        fontFamily: FONTS.display,
        fontSize: '28px',
        color: '#FFFDF7',
      })
      .setOrigin(0.5);

    // Score (big)
    const scoreText = this.add
      .text(cx, 160, '0', {
        fontFamily: FONTS.display,
        fontSize: '64px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    // Animate score count-up
    const finalScore = data.score || 0;
    let displayScore = 0;
    this.tweens.addCounter({
      from: 0,
      to: finalScore,
      duration: 1200,
      ease: 'Power2',
      onUpdate: (tween) => {
        displayScore = Math.round(tween.getValue());
        scoreText.setText(String(displayScore));
      },
    });

    // New best
    const isNewBest = finalScore >= (data.bestScore || 0) && finalScore > 0;
    if (isNewBest) {
      const newBest = this.add
        .text(cx, 205, '★ NEW BEST! ★', {
          fontFamily: FONTS.display,
          fontSize: '24px',
          color: '#FFB703',
          stroke: '#3A2E39',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: newBest,
        alpha: 1,
        scaleX: { from: 0, to: 1 },
        scaleY: { from: 0, to: 1 },
        delay: 1200,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          playLevelUp();
          particles.emitConfetti(cx, 200);
        },
      });
    }

    // Stats
    const stats = [
      { label: 'Best Score', value: String(Math.max(data.bestScore || 0, finalScore)), icon: '🏆' },
      { label: 'Tier Reached', value: String(data.tier || 1), icon: '📈' },
      { label: 'Customers Served', value: String(data.customers || 0), icon: '🧑' },
      { label: 'Coins Earned', value: String(data.coins || 0), icon: '🪙' },
    ];

    stats.forEach((stat, i) => {
      const y = 250 + i * 48;

      this.add
        .text(cx - 180, y, `${stat.icon} ${stat.label}`, {
          fontFamily: FONTS.body,
          fontSize: '22px',
          color: '#3A2E39',
        })
        .setOrigin(0, 0.5)
        .setAlpha(0);

      const valText = this.add
        .text(cx + 180, y, stat.value, {
          fontFamily: FONTS.display,
          fontSize: '26px',
          color: '#FF5E5B',
        })
        .setOrigin(1, 0.5)
        .setAlpha(0);

      // Staggered reveal
      this.tweens.add({
        targets: [this.children.list[this.children.list.length - 2], valText],
        alpha: 1,
        x: '+=0',
        delay: 400 + i * 150,
        duration: 300,
        ease: 'Sine.easeOut',
      });
    });

    // Play Again button
    const btnY = 500;
    const btnG = this.add.graphics();
    btnG.fillStyle(COLORS.accent, 1);
    btnG.fillRoundedRect(cx - 130, btnY - 28, 260, 56, 16);
    btnG.fillStyle(0xffffff, 0.15);
    btnG.fillRoundedRect(cx - 126, btnY - 24, 252, 24, { tl: 14, tr: 14, bl: 0, br: 0 });
    btnG.lineStyle(3, COLORS.ink, 0.7);
    btnG.strokeRoundedRect(cx - 130, btnY - 28, 260, 56, 16);

    const btnText = this.add
      .text(cx, btnY, 'Play Again', {
        fontFamily: FONTS.display,
        fontSize: '30px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(cx, btnY, 260, 56)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      playTap();
      this.cameras.main.fadeOut(300, 58, 46, 57);
      this.time.delayedCall(300, () => this.scene.start('MenuScene'));
    });
    zone.on('pointerover', () => btnText.setScale(1.05));
    zone.on('pointerout', () => btnText.setScale(1));
  }
}

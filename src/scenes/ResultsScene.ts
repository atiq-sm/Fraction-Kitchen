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
  persistentCoins?: number;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  create(data: ResultsData) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const particles = new ParticleManager(this);

    if (this.textures.exists('bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg').setAlpha(0.5);
    }
    const overlay = this.add.graphics();
    overlay.fillStyle(COLORS.ink, 0.3);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 600;
    const ph = 680;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.96);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 24);
    panel.lineStyle(4, COLORS.ink, 0.6);
    panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 24);

    panel.fillStyle(COLORS.accent, 0.9);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, 60, { tl: 24, tr: 24, bl: 0, br: 0 });

    this.cameras.main.fadeIn(400);

    const panelTop = cy - ph / 2;

    this.add
      .text(cx, panelTop + 30, 'GAME OVER', {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color: '#FFFDF7',
      })
      .setOrigin(0.5);

    const scoreText = this.add
      .text(cx, panelTop + 110, '0', {
        fontFamily: FONTS.display,
        fontSize: '72px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    const finalScore = data.score || 0;
    this.tweens.addCounter({
      from: 0,
      to: finalScore,
      duration: 1200,
      ease: 'Power2',
      onUpdate: (tween) => {
        scoreText.setText(String(Math.round(tween.getValue())));
      },
    });

    const isNewBest = finalScore >= (data.bestScore || 0) && finalScore > 0;
    if (isNewBest) {
      const newBest = this.add
        .text(cx, panelTop + 160, '★ NEW BEST! ★', {
          fontFamily: FONTS.display,
          fontSize: '28px',
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
          particles.emitConfetti(cx, panelTop + 140);
        },
      });
    }

    const stats = [
      { label: 'Best Score', value: String(Math.max(data.bestScore || 0, finalScore)), icon: '🏆' },
      { label: 'Tier Reached', value: String(data.tier || 1), icon: '📈' },
      { label: 'Customers Served', value: String(data.customers || 0), icon: '🧑' },
      { label: 'Coins Earned', value: String(data.coins || 0), icon: '🪙' },
      { label: 'Total Coins', value: String(data.persistentCoins || 0), icon: '💰' },
    ];

    stats.forEach((stat, i) => {
      const y = panelTop + 210 + i * 55;

      const label = this.add
        .text(cx - 200, y, `${stat.icon} ${stat.label}`, {
          fontFamily: FONTS.body,
          fontSize: '24px',
          color: '#3A2E39',
        })
        .setOrigin(0, 0.5)
        .setAlpha(0);

      const valText = this.add
        .text(cx + 200, y, stat.value, {
          fontFamily: FONTS.display,
          fontSize: '30px',
          color: '#FF5E5B',
        })
        .setOrigin(1, 0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: [label, valText],
        alpha: 1,
        delay: 400 + i * 150,
        duration: 300,
        ease: 'Sine.easeOut',
      });
    });

    const btnY = panelTop + ph - 70;
    const btnG = this.add.graphics();
    btnG.fillStyle(COLORS.accent, 1);
    btnG.fillRoundedRect(cx - 150, btnY - 30, 300, 60, 18);
    btnG.fillStyle(0xffffff, 0.15);
    btnG.fillRoundedRect(cx - 146, btnY - 26, 292, 26, { tl: 16, tr: 16, bl: 0, br: 0 });
    btnG.lineStyle(3, COLORS.ink, 0.7);
    btnG.strokeRoundedRect(cx - 150, btnY - 30, 300, 60, 18);

    const btnText = this.add
      .text(cx, btnY, 'Play Again', {
        fontFamily: FONTS.display,
        fontSize: '34px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(cx, btnY, 300, 60)
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

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { initAudio, isMuted, setMuted, playTap } from '../audio/SoundSynth';
import { ScoreManager } from '../core/ScoreManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    if (this.textures.exists('bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg');
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Title card panel
    const pw = 700;
    const ph = 820;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.92);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2 - 20, pw, ph, 28);
    panel.lineStyle(4, COLORS.ink, 0.5);
    panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2 - 20, pw, ph, 28);

    const panelTop = cy - ph / 2 - 20;

    // Title
    const title = this.add
      .text(cx, panelTop + 100, 'Fraction\nKitchen', {
        fontFamily: FONTS.display,
        fontSize: '80px',
        color: '#3A2E39',
        align: 'center',
        lineSpacing: -10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, panelTop + 210, 'A Juice Bar Math Adventure', {
        fontFamily: FONTS.body,
        fontSize: '28px',
        color: '#FF5E5B',
      })
      .setOrigin(0.5);

    // Decorative fruit dots
    const fruitColors = [0xff4d6d, 0xffce45, 0x5b6cff, 0x3cb371];
    fruitColors.forEach((color, i) => {
      this.add.circle(cx - 100 + i * 66, panelTop + 260, 12, color).setAlpha(0.7);
    });

    // Start button
    const btnY = panelTop + 330;
    const btnG = this.add.graphics();
    btnG.fillStyle(COLORS.accent, 1);
    btnG.fillRoundedRect(cx - 150, btnY - 35, 300, 70, 18);
    btnG.fillStyle(0xffffff, 0.15);
    btnG.fillRoundedRect(cx - 144, btnY - 31, 288, 30, { tl: 16, tr: 16, bl: 0, br: 0 });
    btnG.lineStyle(3, COLORS.ink, 0.7);
    btnG.strokeRoundedRect(cx - 150, btnY - 35, 300, 70, 18);

    const btnText = this.add
      .text(cx, btnY, 'START', {
        fontFamily: FONTS.display,
        fontSize: '40px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const startZone = this.add
      .zone(cx, btnY, 300, 70)
      .setInteractive({ useHandCursor: true });

    startZone.on('pointerdown', () => {
      initAudio();
      playTap();
      this.cameras.main.fadeOut(300, 58, 46, 57);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });
    startZone.on('pointerover', () => btnText.setScale(1.06));
    startZone.on('pointerout', () => btnText.setScale(1));

    // Multiplayer button
    const mpBtnY = panelTop + 420;
    const mpG = this.add.graphics();
    mpG.fillStyle(COLORS.blue, 1);
    mpG.fillRoundedRect(cx - 120, mpBtnY - 25, 240, 50, 14);
    mpG.fillStyle(0xffffff, 0.15);
    mpG.fillRoundedRect(cx - 116, mpBtnY - 22, 232, 22, { tl: 12, tr: 12, bl: 0, br: 0 });
    mpG.lineStyle(2, COLORS.ink, 0.6);
    mpG.strokeRoundedRect(cx - 120, mpBtnY - 25, 240, 50, 14);

    const mpText = this.add
      .text(cx, mpBtnY, 'MULTIPLAYER', {
        fontFamily: FONTS.display,
        fontSize: '24px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const mpZone = this.add
      .zone(cx, mpBtnY, 240, 50)
      .setInteractive({ useHandCursor: true });

    mpZone.on('pointerdown', () => {
      initAudio();
      playTap();
      this.scene.start('LobbyScene');
    });
    mpZone.on('pointerover', () => mpText.setScale(1.05));
    mpZone.on('pointerout', () => mpText.setScale(1));

    // Best score
    const sm = new ScoreManager();
    if (sm.bestScore > 0) {
      this.add
        .text(cx, panelTop + 480, `Best Score: ${sm.bestScore}`, {
          fontFamily: FONTS.display,
          fontSize: '26px',
          color: '#FFB703',
          stroke: '#3A2E39',
          strokeThickness: 2,
        })
        .setOrigin(0.5);
    }

    // How to play
    const howToY = panelTop + 530;
    this.add
      .text(cx, howToY, 'How to Play', {
        fontFamily: FONTS.display,
        fontSize: '24px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    const steps = [
      '1. Read the order — fill to the target fraction',
      '2. Tap scoops to pour unit fractions into the glass',
      '3. Hit SERVE when you match — equivalence accepted!',
    ];
    steps.forEach((step, i) => {
      this.add
        .text(cx, howToY + 34 + i * 28, step, {
          fontFamily: FONTS.body,
          fontSize: '18px',
          color: '#3A2E39',
          wordWrap: { width: 580 },
        })
        .setOrigin(0.5);
    });

    // Mute toggle
    const muteText = this.add
      .text(GAME_WIDTH - 70, 40, isMuted() ? '🔇' : '🔊', {
        fontSize: '36px',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    muteText.on('pointerdown', () => {
      setMuted(!isMuted());
      muteText.setText(isMuted() ? '🔇' : '🔊');
    });

    this.tweens.add({
      targets: title,
      y: title.y - 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

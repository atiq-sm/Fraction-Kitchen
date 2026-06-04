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

    // Background
    if (this.textures.exists('bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg');
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Title card panel
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.92);
    panel.fillRoundedRect(cx - 320, 60, 640, 560, 24);
    panel.lineStyle(4, COLORS.ink, 0.5);
    panel.strokeRoundedRect(cx - 320, 60, 640, 560, 24);

    // Title
    const title = this.add
      .text(cx, 140, 'Fraction\nKitchen', {
        fontFamily: FONTS.display,
        fontSize: '68px',
        color: '#3A2E39',
        align: 'center',
        lineSpacing: -8,
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(cx, 248, 'A Juice Bar Math Adventure', {
        fontFamily: FONTS.body,
        fontSize: '24px',
        color: '#FF5E5B',
      })
      .setOrigin(0.5);

    // Decorative fruit dots
    const fruitColors = [0xff4d6d, 0xffce45, 0x5b6cff, 0x3cb371];
    fruitColors.forEach((color, i) => {
      const dotX = cx - 90 + i * 60;
      this.add.circle(dotX, 290, 10, color).setAlpha(0.7);
    });

    // Start button
    const btnY = 350;
    const btnG = this.add.graphics();
    btnG.fillStyle(COLORS.accent, 1);
    btnG.fillRoundedRect(cx - 130, btnY - 30, 260, 60, 16);
    // Highlight
    btnG.fillStyle(0xffffff, 0.15);
    btnG.fillRoundedRect(cx - 124, btnY - 26, 248, 26, { tl: 14, tr: 14, bl: 0, br: 0 });
    btnG.lineStyle(3, COLORS.ink, 0.7);
    btnG.strokeRoundedRect(cx - 130, btnY - 30, 260, 60, 16);

    const btnText = this.add
      .text(cx, btnY, 'START', {
        fontFamily: FONTS.display,
        fontSize: '34px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const startZone = this.add
      .zone(cx, btnY, 260, 60)
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
    const mpBtnY = 420;
    const mpG = this.add.graphics();
    mpG.fillStyle(COLORS.blue, 1);
    mpG.fillRoundedRect(cx - 110, mpBtnY - 22, 220, 44, 12);
    mpG.fillStyle(0xffffff, 0.15);
    mpG.fillRoundedRect(cx - 106, mpBtnY - 19, 212, 18, { tl: 10, tr: 10, bl: 0, br: 0 });
    mpG.lineStyle(2, COLORS.ink, 0.6);
    mpG.strokeRoundedRect(cx - 110, mpBtnY - 22, 220, 44, 12);

    const mpText = this.add
      .text(cx, mpBtnY, 'MULTIPLAYER', {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const mpZone = this.add
      .zone(cx, mpBtnY, 220, 44)
      .setInteractive({ useHandCursor: true });

    mpZone.on('pointerdown', () => {
      initAudio();
      playTap();
      this.scene.start('LobbyScene');
    });
    mpZone.on('pointerover', () => mpText.setScale(1.05));
    mpZone.on('pointerout', () => mpText.setScale(1));

    // How to play
    const howToY = 480;
    this.add
      .text(cx, howToY, 'How to Play', {
        fontFamily: FONTS.display,
        fontSize: '22px',
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
        .text(cx, howToY + 30 + i * 26, step, {
          fontFamily: FONTS.body,
          fontSize: '16px',
          color: '#3A2E39',
          wordWrap: { width: 500 },
        })
        .setOrigin(0.5);
    });

    // Best score
    const sm = new ScoreManager();
    if (sm.bestScore > 0) {
      this.add
        .text(cx, 570, `Best Score: ${sm.bestScore}`, {
          fontFamily: FONTS.display,
          fontSize: '22px',
          color: '#FFB703',
          stroke: '#3A2E39',
          strokeThickness: 2,
        })
        .setOrigin(0.5);
    }

    // Mute toggle
    const muteText = this.add
      .text(GAME_WIDTH - 60, 30, isMuted() ? '🔇' : '🔊', {
        fontSize: '32px',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    muteText.on('pointerdown', () => {
      setMuted(!isMuted());
      muteText.setText(isMuted() ? '🔇' : '🔊');
    });

    // Subtle title animation
    this.tweens.add({
      targets: title,
      y: title.y - 4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

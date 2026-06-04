import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { initAudio, isMuted, setMuted, playTap } from '../audio/SoundSynth';
import { ScoreManager } from '../core/ScoreManager';
import { ShopManager } from '../core/ShopManager';
import { RunState } from '../core/RunState';

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

    const pw = 720;
    const ph = 860;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.92);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2 - 10, pw, ph, 28);
    panel.lineStyle(4, COLORS.ink, 0.5);
    panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2 - 10, pw, ph, 28);

    const panelTop = cy - ph / 2 - 10;

    // Title
    const title = this.add
      .text(cx, panelTop + 90, 'Fraction\nKitchen', {
        fontFamily: FONTS.display,
        fontSize: '76px',
        color: '#3A2E39',
        align: 'center',
        lineSpacing: -10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, panelTop + 200, 'A Math Kitchen Adventure', {
        fontFamily: FONTS.body,
        fontSize: '26px',
        color: '#FF5E5B',
      })
      .setOrigin(0.5);

    const fruitColors = [0xff4d6d, 0xffce45, 0x5b6cff, 0x3cb371];
    fruitColors.forEach((color, i) => {
      this.add.circle(cx - 100 + i * 66, panelTop + 245, 10, color).setAlpha(0.7);
    });

    // ADVENTURE button (primary — new roguelike mode)
    this.makeButton(cx, panelTop + 310, 320, 70, 'ADVENTURE', COLORS.accent, () => {
      initAudio();
      playTap();
      const run = new RunState();
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start('MapScene', { runState: run }));
    });

    // QUICK PLAY button (original fractions mode)
    this.makeButton(cx, panelTop + 395, 260, 56, 'QUICK PLAY', COLORS.mint, () => {
      initAudio();
      playTap();
      const shopMgr = new ShopManager();
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () =>
        this.scene.start('ShopScene', {
          shop: shopMgr,
          returnScene: 'GameScene',
          returnData: { shop: shopMgr },
        }),
      );
    });

    // MULTIPLAYER button
    this.makeButton(cx, panelTop + 465, 220, 46, 'MULTIPLAYER', COLORS.blue, () => {
      initAudio();
      playTap();
      this.scene.start('LobbyScene');
    });

    // Stats
    const sm = new ScoreManager();
    const shopInfo = new ShopManager();
    const statsLine = [];
    if (sm.bestScore > 0) statsLine.push(`🏆 ${sm.bestScore}`);
    statsLine.push(`🪙 ${shopInfo.coins}`);
    this.add
      .text(cx, panelTop + 530, statsLine.join('    '), {
        fontFamily: FONTS.display,
        fontSize: '24px',
        color: '#FFB703',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // How to play
    this.add
      .text(cx, panelTop + 580, 'How to Play', {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    const steps = [
      '🗺️ Adventure: Navigate a branching map of math challenges',
      '➕ Solve addition, subtraction, multiplication & fractions',
      '💀 Defeat the boss to unlock Endless Mode!',
    ];
    steps.forEach((step, i) => {
      this.add
        .text(cx, panelTop + 612 + i * 26, step, {
          fontFamily: FONTS.body,
          fontSize: '15px',
          color: '#3A2E39',
          wordWrap: { width: 600 },
        })
        .setOrigin(0.5);
    });

    // Mute
    const muteText = this.add
      .text(GAME_WIDTH - 70, 40, isMuted() ? '🔇' : '🔊', { fontSize: '36px' })
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

    this.cameras.main.fadeIn(300);
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void,
  ) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, h / 3.5);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(x - w / 2 + 4, y - h / 2 + 3, w - 8, h / 2 - 3, {
      tl: h / 4,
      tr: h / 4,
      bl: 0,
      br: 0,
    });
    g.lineStyle(3, COLORS.ink, 0.7);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, h / 3.5);

    const text = this.add
      .text(x, y, label, {
        fontFamily: FONTS.display,
        fontSize: `${Math.round(h * 0.5)}px`,
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(x, y, w, h)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => text.setScale(1.05));
    zone.on('pointerout', () => text.setScale(1));
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { ArtGenerator } from '../art/ArtGenerator';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(cx, cy - 50, 'Fraction Kitchen', {
        fontFamily: FONTS.display,
        fontSize: '52px',
        color: '#3A2E39',
        stroke: '#FFD8A8',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const loadText = this.add
      .text(cx, cy + 10, 'Preparing ingredients...', {
        fontFamily: FONTS.body,
        fontSize: '22px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.ink, 0.15);
    barBg.fillRoundedRect(cx - 150, cy + 50, 300, 16, 8);

    const bar = this.add.graphics();

    // Generate all programmatic textures
    ArtGenerator.generate(this);

    let progress = 0;
    this.time.addEvent({
      delay: 20,
      repeat: 20,
      callback: () => {
        progress += 0.05;
        bar.clear();
        bar.fillStyle(COLORS.accent, 1);
        bar.fillRoundedRect(cx - 150, cy + 50, 300 * Math.min(progress, 1), 16, 8);

        if (progress >= 0.5) {
          loadText.setText('Slicing fruit...');
        }
        if (progress >= 1) {
          loadText.setText('Ready!');
          this.time.delayedCall(200, () => this.scene.start('MenuScene'));
        }
      },
    });
  }
}

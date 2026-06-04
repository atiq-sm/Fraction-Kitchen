import Phaser from 'phaser';
import { GAME_WIDTH, COLORS, FONTS, LAYOUT } from '../config/constants';
import type { SkillConfig } from '../core/types';
import { TimerBar } from '../ui/TimerBar';
import { Hearts } from '../ui/Hearts';
import { ComboText } from '../ui/ComboText';
import { CoinCounter } from '../ui/CoinCounter';

export class HudScene extends Phaser.Scene {
  private timerBar!: TimerBar;
  private hearts!: Hearts;
  private comboText!: ComboText;
  private coinCounter!: CoinCounter;
  private scoreText!: Phaser.GameObjects.Text;
  private tierText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HudScene' });
  }

  create() {
    const config = this.registry.get('skillConfig') as SkillConfig;
    const gs = this.scene.get('GameScene') as { lives: number };
    const maxLives = gs?.lives ?? config.meta.lives;

    this.timerBar = new TimerBar(this);
    this.hearts = new Hearts(this, LAYOUT.hud.heartsX, LAYOUT.hud.heartsY, maxLives);
    this.comboText = new ComboText(this, LAYOUT.glass.x, LAYOUT.glass.y + 80);

    this.scoreText = this.add
      .text(LAYOUT.hud.scoreX, LAYOUT.hud.heartsY, 'Score: 0', {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: '#3A2E39',
        stroke: '#FFFDF7',
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5);

    this.coinCounter = new CoinCounter(this, LAYOUT.hud.scoreX - 200, LAYOUT.hud.heartsY);

    this.tierText = this.add
      .text(GAME_WIDTH / 2, LAYOUT.hud.heartsY, 'Tier 1', {
        fontFamily: FONTS.body,
        fontSize: '20px',
        color: '#FF5E5B',
        stroke: '#FFFDF7',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('lives-update', (lives: number) => {
      this.hearts.setLives(lives);
    });

    gameScene.events.on('score-update', (score: number, coins: number) => {
      this.scoreText.setText(`Score: ${score}`);
      this.coinCounter.setCoins(coins);
    });

    gameScene.events.on('combo-update', (combo: number) => {
      this.comboText.show(combo);
    });

    gameScene.events.on('tier-update', (tier: number) => {
      const prevTier = parseInt(this.tierText.text.replace('Tier ', ''));
      this.tierText.setText(`Tier ${tier}`);
      if (tier > prevTier) {
        this.showBanner('LEVEL UP!', '#3CB371');
      } else if (tier < prevTier) {
        this.showBanner("Let's practice!", '#FFB703');
      }
    });

    gameScene.events.on('timer-update', (remaining: number, total: number) => {
      this.timerBar.update(remaining, total);
    });

    gameScene.events.on('serve-success', () => {
      this.cameras.main.flash(100, 60, 179, 113, false, undefined, 0.15);
    });

    gameScene.events.on('serve-fail', () => {
      this.cameras.main.shake(200, 0.004);
    });
  }

  private showBanner(text: string, color: string) {
    const banner = this.add
      .text(GAME_WIDTH / 2, 300, text, {
        fontFamily: FONTS.display,
        fontSize: '52px',
        color,
        stroke: '#3A2E39',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScale(0)
      .setDepth(200);

    this.tweens.add({
      targets: banner,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          onComplete: () => {
            this.tweens.add({
              targets: banner,
              alpha: 0,
              y: banner.y - 40,
              delay: 800,
              duration: 400,
              onComplete: () => banner.destroy(),
            });
          },
        });
      },
    });
  }
}

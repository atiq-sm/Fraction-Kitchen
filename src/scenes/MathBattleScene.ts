import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { MathProblemGenerator } from '../core/MathProblemGenerator';
import type { MathProblem } from '../core/MathProblemGenerator';
import { RunState } from '../core/RunState';
import * as Sound from '../audio/SoundSynth';
import { ParticleManager } from '../effects/ParticleManager';

interface BattleData {
  runState: RunState;
  nodeId: string;
  mathType: 'addition' | 'subtraction' | 'multiplication' | 'mixed';
  difficulty: number;
  problemCount: number;
  isBoss: boolean;
}

const PATIENCE_MS = 12000;
const BOSS_PATIENCE_MS = 15000;

export class MathBattleScene extends Phaser.Scene {
  private runState!: RunState;
  private nodeId!: string;
  private problems: MathProblem[] = [];
  private currentIndex = 0;
  private combo = 0;
  private earnedScore = 0;
  private earnedCoins = 0;
  private isBoss = false;
  private particles!: ParticleManager;

  private questionText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private timerBg!: Phaser.GameObjects.Graphics;
  private answerButtons: Phaser.GameObjects.Container[] = [];
  private patienceTimer: Phaser.Time.TimerEvent | null = null;
  private patienceRemaining = 0;
  private patienceTotal = 0;
  private isAnswering = false;

  constructor() {
    super({ key: 'MathBattleScene' });
  }

  create(data: BattleData) {
    this.runState = data.runState;
    this.nodeId = data.nodeId;
    this.isBoss = data.isBoss;
    this.currentIndex = 0;
    this.combo = 0;
    this.earnedScore = 0;
    this.earnedCoins = 0;
    this.isAnswering = false;
    this.answerButtons = [];
    this.patienceTimer = null;
    this.particles = new ParticleManager(this);

    const gen = new MathProblemGenerator(Date.now());
    const type = data.mathType === 'mixed' ? 'mixed' : data.mathType;
    this.problems = gen.generateBatch(type as 'addition', data.problemCount, data.difficulty);
    this.patienceTotal = this.isBoss ? BOSS_PATIENCE_MS : PATIENCE_MS;

    this.drawBackground();
    this.drawHud();
    this.showProblem();

    this.cameras.main.fadeIn(200);
  }

  private drawBackground() {
    const bg = this.add.graphics();
    if (this.isBoss) {
      bg.fillGradientStyle(0x2d1b3d, 0x1a0a2e, 0x3d1b2d, 0x1a0a2e);
    } else {
      bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
    }
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.isBoss) {
      this.add
        .text(GAME_WIDTH / 2, 60, '💀 BOSS BATTLE 💀', {
          fontFamily: FONTS.display,
          fontSize: '42px',
          color: '#FF0055',
          stroke: '#1a0a2e',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
    }
  }

  private drawHud() {
    const hudY = this.isBoss ? 110 : 30;

    this.livesText = this.add
      .text(50, hudY, `❤️ ${this.runState.lives}`, {
        fontFamily: FONTS.display,
        fontSize: '28px',
        color: '#FF5E5B',
      })
      .setOrigin(0, 0.5);

    this.progressText = this.add
      .text(GAME_WIDTH / 2, hudY, `Problem 1/${this.problems.length}`, {
        fontFamily: FONTS.body,
        fontSize: '22px',
        color: this.isBoss ? '#FFD8A8' : '#3A2E39',
      })
      .setOrigin(0.5);

    this.comboText = this.add
      .text(GAME_WIDTH - 50, hudY, '', {
        fontFamily: FONTS.display,
        fontSize: '28px',
        color: '#FFB703',
      })
      .setOrigin(1, 0.5);

    // Timer bar
    const barY = hudY + 30;
    this.timerBg = this.add.graphics();
    this.timerBg.fillStyle(COLORS.ink, 0.15);
    this.timerBg.fillRoundedRect(50, barY, GAME_WIDTH - 100, 14, 7);

    this.timerBar = this.add.graphics();
  }

  private showProblem() {
    // Clean up previous problem's elements FIRST
    if (this.questionText) {
      this.questionText.destroy();
      this.questionText = undefined!;
    }
    for (const btn of this.answerButtons) btn.destroy();
    this.answerButtons = [];

    if (this.currentIndex >= this.problems.length) {
      this.handleVictory();
      return;
    }

    this.isAnswering = false;
    const problem = this.problems[this.currentIndex];
    this.progressText.setText(`Problem ${this.currentIndex + 1}/${this.problems.length}`);

    const cx = GAME_WIDTH / 2;
    const qY = GAME_HEIGHT * 0.35;

    // Type indicator
    const typeLabels: Record<string, string> = {
      addition: '➕ Addition',
      subtraction: '➖ Subtraction',
      multiplication: '✖️ Multiplication',
    };
    this.add
      .text(cx, qY - 80, typeLabels[problem.type] || '', {
        fontFamily: FONTS.body,
        fontSize: '22px',
        color: this.isBoss ? '#999' : '#888',
      })
      .setOrigin(0.5);

    // Question
    this.questionText = this.add
      .text(cx, qY, `${problem.question} = ?`, {
        fontFamily: FONTS.display,
        fontSize: '72px',
        color: this.isBoss ? '#FFD8A8' : '#3A2E39',
        stroke: this.isBoss ? '#1a0a2e' : '#FFD8A8',
        strokeThickness: this.isBoss ? 4 : 0,
      })
      .setOrigin(0.5);

    // Scale-in animation
    this.questionText.setScale(0);
    this.tweens.add({
      targets: this.questionText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Answer buttons (2x2 grid)
    const btnW = 280;
    const btnH = 80;
    const gap = 30;
    const gridStartX = cx - btnW - gap / 2;
    const gridStartY = GAME_HEIGHT * 0.55;

    problem.choices.forEach((choice, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = gridStartX + col * (btnW + gap) + btnW / 2;
      const by = gridStartY + row * (btnH + gap) + btnH / 2;

      const container = this.add.container(bx, by);

      const bg = this.add.graphics();
      const color = this.isBoss ? 0x3d1b4d : COLORS.surface;
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
      bg.lineStyle(3, this.isBoss ? 0x6633aa : COLORS.ink, 0.6);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
      container.add(bg);

      const text = this.add
        .text(0, 0, String(choice), {
          fontFamily: FONTS.display,
          fontSize: '36px',
          color: this.isBoss ? '#FFD8A8' : '#3A2E39',
        })
        .setOrigin(0.5);
      container.add(text);

      container.setSize(btnW, btnH);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.handleAnswer(choice, problem.answer, container));
      container.on('pointerover', () => container.setScale(1.05));
      container.on('pointerout', () => container.setScale(1));

      // Staggered appear
      container.setAlpha(0);
      container.setScale(0.8);
      this.tweens.add({
        targets: container,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        delay: 200 + i * 80,
        duration: 200,
        ease: 'Back.easeOut',
      });

      this.answerButtons.push(container);
    });

    // Start patience timer
    this.startTimer();
  }

  private startTimer() {
    if (this.patienceTimer) this.patienceTimer.remove();
    this.patienceRemaining = this.patienceTotal;

    this.patienceTimer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.patienceRemaining -= 100;
        this.updateTimerBar();
        if (this.patienceRemaining <= 0) {
          this.handleTimeout();
        }
      },
    });
  }

  private updateTimerBar() {
    const hudY = this.isBoss ? 110 : 30;
    const barY = hudY + 30;
    const progress = Math.max(0, this.patienceRemaining / this.patienceTotal);

    this.timerBar.clear();
    let color: number = COLORS.mint;
    if (progress < 0.5) color = COLORS.mango;
    if (progress < 0.25) color = COLORS.accent;

    this.timerBar.fillStyle(color, 1);
    this.timerBar.fillRoundedRect(50, barY, (GAME_WIDTH - 100) * progress, 14, 7);
  }

  private handleAnswer(
    selected: number,
    correct: number,
    button: Phaser.GameObjects.Container,
  ) {
    if (this.isAnswering) return;
    this.isAnswering = true;
    if (this.patienceTimer) this.patienceTimer.remove();

    if (selected === correct) {
      this.combo++;
      const points = 50 * (1 + 0.1 * Math.min(this.combo, 10));
      this.earnedScore += Math.round(points);
      this.earnedCoins += 5 + Math.floor(this.combo / 2);

      Sound.playSuccess(this.combo);
      this.particles.emitConfetti(button.x, button.y);

      // Flash button green
      const flash = this.add.graphics();
      flash.fillStyle(COLORS.mint, 0.8);
      flash.fillRoundedRect(button.x - 140, button.y - 40, 280, 80, 16);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy(),
      });

      this.comboText.setText(this.combo > 1 ? `x${this.combo}!` : '');

      this.showFloating(`+${Math.round(points)}`, button.x, button.y - 50, '#3CB371');
    } else {
      this.combo = 0;
      this.comboText.setText('');
      Sound.playError();
      this.cameras.main.shake(200, 0.004);

      const dead = this.runState.loseLife();
      this.livesText.setText(`❤️ ${this.runState.lives}`);

      // Flash button red
      const flash = this.add.graphics();
      flash.fillStyle(COLORS.accent, 0.8);
      flash.fillRoundedRect(button.x - 140, button.y - 40, 280, 80, 16);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy(),
      });

      this.showFloating(`✗ ${correct}`, button.x, button.y - 50, '#FF5E5B');

      if (dead) {
        this.time.delayedCall(800, () => this.handleDefeat());
        return;
      }
    }

    this.currentIndex++;
    this.time.delayedCall(800, () => this.showProblem());
  }

  private handleTimeout() {
    if (this.patienceTimer) this.patienceTimer.remove();
    this.isAnswering = true;
    this.combo = 0;

    Sound.playError();
    const dead = this.runState.loseLife();
    this.livesText.setText(`❤️ ${this.runState.lives}`);
    this.showFloating('TIME UP!', GAME_WIDTH / 2, GAME_HEIGHT * 0.45, '#FFB703');

    if (dead) {
      this.time.delayedCall(800, () => this.handleDefeat());
      return;
    }

    this.currentIndex++;
    this.time.delayedCall(800, () => this.showProblem());
  }

  private disableAllButtons() {
    for (const btn of this.answerButtons) {
      btn.disableInteractive();
      btn.setAlpha(0.3);
    }
  }

  private handleVictory() {
    if (this.patienceTimer) this.patienceTimer.remove();
    this.disableAllButtons();

    this.runState.completeNode(this.nodeId);
    this.runState.addScore(this.earnedScore);
    this.runState.shop.addCoins(this.earnedCoins);

    if (this.isBoss) {
      this.runState.bossDefeated = true;
      Sound.playLevelUp();
      this.showVictoryScreen();
    } else {
      Sound.playSuccess(5);
      this.showRewardScreen();
    }
  }

  private showRewardScreen() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Block input behind
    this.add.zone(cx, cy, GAME_WIDTH, GAME_HEIGHT).setDepth(299).setInteractive();

    const overlay = this.add.graphics().setDepth(300);
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics().setDepth(301);
    panel.fillStyle(COLORS.cream, 0.97);
    panel.fillRoundedRect(cx - 250, cy - 120, 500, 240, 20);
    panel.lineStyle(3, COLORS.ink, 0.6);
    panel.strokeRoundedRect(cx - 250, cy - 120, 500, 240, 20);

    this.add
      .text(cx, cy - 70, '✅ Victory!', {
        fontFamily: FONTS.display,
        fontSize: '40px',
        color: '#3CB371',
        stroke: '#3A2E39',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(302);

    this.add
      .text(cx, cy - 10, `+${this.earnedScore} points    🪙 +${this.earnedCoins}`, {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: '#3A2E39',
      })
      .setOrigin(0.5)
      .setDepth(302);

    // Continue button with bg
    const btnBg = this.add.graphics().setDepth(302);
    btnBg.fillStyle(COLORS.accent, 1);
    btnBg.fillRoundedRect(cx - 100, cy + 38, 200, 48, 14);

    this.add
      .text(cx, cy + 62, 'Continue →', {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: '#FFFDF7',
      })
      .setOrigin(0.5)
      .setDepth(303);

    this.add.zone(cx, cy + 62, 200, 48)
      .setDepth(304)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MapScene', { runState: this.runState });
    });

    this.particles.emitConfetti(cx, cy - 100);
  }

  private showVictoryScreen() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Clickable overlay blocks input to everything behind
    this.add.zone(cx, cy, GAME_WIDTH, GAME_HEIGHT)
      .setDepth(299)
      .setInteractive();

    const overlay = this.add.graphics().setDepth(300);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics().setDepth(301);
    panel.fillStyle(COLORS.cream, 0.97);
    panel.fillRoundedRect(cx - 300, cy - 160, 600, 320, 24);
    panel.lineStyle(4, 0xffd700, 0.8);
    panel.strokeRoundedRect(cx - 300, cy - 160, 600, 320, 24);

    this.add
      .text(cx, cy - 100, '🏆 BOSS DEFEATED! 🏆', {
        fontFamily: FONTS.display,
        fontSize: '44px',
        color: '#FFB703',
        stroke: '#3A2E39',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(302);

    this.add
      .text(cx, cy - 30, `Final Score: ${this.runState.score + this.earnedScore}`, {
        fontFamily: FONTS.display,
        fontSize: '30px',
        color: '#3A2E39',
      })
      .setOrigin(0.5)
      .setDepth(302);

    this.add
      .text(cx, cy + 10, `🪙 ${this.runState.shop.coins + this.earnedCoins} total coins`, {
        fontFamily: FONTS.body,
        fontSize: '22px',
        color: '#FFB703',
      })
      .setOrigin(0.5)
      .setDepth(302);

    // Menu button with background
    const menuBg = this.add.graphics().setDepth(302);
    menuBg.fillStyle(COLORS.accent, 1);
    menuBg.fillRoundedRect(cx - 220, cy + 55, 180, 50, 14);
    this.add
      .text(cx - 130, cy + 80, 'Menu', {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: '#FFFDF7',
      })
      .setOrigin(0.5)
      .setDepth(303);
    this.add.zone(cx - 130, cy + 80, 180, 50)
      .setDepth(304)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));

    // Endless mode button with background
    const endlessBg = this.add.graphics().setDepth(302);
    endlessBg.fillStyle(COLORS.mint, 1);
    endlessBg.fillRoundedRect(cx + 40, cy + 55, 220, 50, 14);
    this.add
      .text(cx + 150, cy + 80, 'Endless Mode →', {
        fontFamily: FONTS.display,
        fontSize: '24px',
        color: '#FFFDF7',
      })
      .setOrigin(0.5)
      .setDepth(303);
    this.add.zone(cx + 150, cy + 80, 220, 50)
      .setDepth(304)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('GameScene', { shop: this.runState.shop }));

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 400, () => {
        this.particles.emitConfetti(cx + Phaser.Math.Between(-200, 200), cy - 150);
      });
    }
  }

  private handleDefeat() {
    this.cameras.main.fadeOut(500, 30, 10, 30);
    this.time.delayedCall(600, () => {
      this.scene.start('ResultsScene', {
        score: this.runState.score + this.earnedScore,
        bestScore: 0,
        tier: 0,
        customers: 0,
        coins: this.earnedCoins,
        persistentCoins: this.runState.shop.coins,
        adventure: true,
      });
    });
  }

  private showFloating(text: string, x: number, y: number, color: string) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color,
        stroke: '#3A2E39',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(250);

    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }
}

import Phaser from 'phaser';
import { Fraction } from '../core/Fraction';
import { RNG } from '../core/RNG';
import { OrderGenerator } from '../core/OrderGenerator';
import { DifficultyManager } from '../core/DifficultyManager';
import { ScoreManager } from '../core/ScoreManager';
import { totalFill, validateServe } from '../core/Glass';
import type { GlassState, Order, SkillConfig, Ingredient, Pour } from '../core/types';
import { GlassVisual } from '../objects/GlassVisual';
import { ScoopButton } from '../objects/ScoopButton';
import { Ticket } from '../objects/Ticket';
import { Customer } from '../objects/Customer';
import { ParticleManager } from '../effects/ParticleManager';
import * as Sound from '../audio/SoundSynth';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS, LAYOUT } from '../config/constants';
import { hexStringToNumber } from '../utils/ColorUtils';

export class GameScene extends Phaser.Scene {
  private orderGen!: OrderGenerator;
  private difficulty!: DifficultyManager;
  scoreManager!: ScoreManager;
  private config!: SkillConfig;
  private ingredients!: Ingredient[];
  private particles!: ParticleManager;

  private glass!: GlassVisual;
  private ticket!: Ticket;
  private customer!: Customer;
  private scoopButtons: ScoopButton[] = [];
  private currentOrder: Order | null = null;
  private glassState: GlassState = [];

  lives = 3;
  private orderStartTime = 0;
  private patienceTimer: Phaser.Time.TimerEvent | null = null;
  private patienceRemaining = 0;

  private selectedIngredientId: string | null = null;
  private ingredientButtons: Phaser.GameObjects.Container[] = [];
  private serveButtonContainer!: Phaser.GameObjects.Container;
  private dumpButtonContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.config = this.registry.get('skillConfig') as SkillConfig;
    this.ingredients = this.config.ingredients;

    const rng = new RNG(Date.now());
    this.orderGen = new OrderGenerator(this.ingredients, this.config.tiers, rng);
    this.difficulty = new DifficultyManager(this.config.difficulty);
    this.scoreManager = new ScoreManager();
    this.scoreManager.reset();
    this.lives = this.config.meta.lives;
    this.glassState = [];
    this.particles = new ParticleManager(this);

    // Background
    if (this.textures.exists('bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg');
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      bg.fillGradientStyle(COLORS.wood, COLORS.woodLight, COLORS.woodDark, COLORS.wood);
      bg.fillRect(0, 540, GAME_WIDTH, 180);
    }

    this.glass = new GlassVisual(
      this,
      LAYOUT.glass.x,
      LAYOUT.glass.y + LAYOUT.glass.height / 2 - 30,
      this.config.glass.capacityCups,
      this.ingredients,
    );

    this.ticket = new Ticket(this, LAYOUT.ticket.x, LAYOUT.ticket.y - 40);

    this.customer = new Customer(this, LAYOUT.customer.x, LAYOUT.customer.y);
    this.registry.set('customerX', LAYOUT.customer.x);

    this.createServeButton();
    this.createDumpButton();

    this.scene.launch('HudScene');

    this.events.emit('lives-update', this.lives);
    this.events.emit('score-update', this.scoreManager.score, this.scoreManager.coins);
    this.events.emit('combo-update', this.scoreManager.combo);
    this.events.emit('tier-update', this.difficulty.currentTier);

    this.cameras.main.fadeIn(300);
    this.spawnOrder();
  }

  private createServeButton() {
    const { x, y } = LAYOUT.serveButton;
    this.serveButtonContainer = this.add.container(x, y - 10);

    const g = this.add.graphics();
    // Shadow
    g.fillStyle(COLORS.ink, 0.12);
    g.fillRoundedRect(-83, -23, 166, 50, 14);
    // Button
    g.fillStyle(COLORS.mint, 1);
    g.fillRoundedRect(-80, -25, 160, 50, 14);
    // Highlight
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(-76, -22, 152, 22, { tl: 12, tr: 12, bl: 0, br: 0 });
    g.lineStyle(3, COLORS.ink, 0.7);
    g.strokeRoundedRect(-80, -25, 160, 50, 14);
    this.serveButtonContainer.add(g);

    const text = this.add
      .text(0, 0, 'SERVE ✓', {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.serveButtonContainer.add(text);

    this.serveButtonContainer.setSize(160, 50);
    this.serveButtonContainer.setInteractive({ useHandCursor: true });
    this.serveButtonContainer.on('pointerdown', () => {
      this.tweens.add({
        targets: this.serveButtonContainer,
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 60,
        yoyo: true,
      });
      this.handleServe();
    });
  }

  private createDumpButton() {
    const { x, y } = LAYOUT.dumpButton;
    this.dumpButtonContainer = this.add.container(x, y - 10);

    const g = this.add.graphics();
    g.fillStyle(COLORS.accent, 0.5);
    g.fillRoundedRect(-60, -16, 120, 32, 10);
    g.lineStyle(2, COLORS.ink, 0.4);
    g.strokeRoundedRect(-60, -16, 120, 32, 10);
    this.dumpButtonContainer.add(g);

    const text = this.add
      .text(0, 0, 'DUMP ✕', {
        fontFamily: FONTS.body,
        fontSize: '18px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 1,
      })
      .setOrigin(0.5);
    this.dumpButtonContainer.add(text);

    this.dumpButtonContainer.setSize(120, 32);
    this.dumpButtonContainer.setInteractive({ useHandCursor: true });
    this.dumpButtonContainer.on('pointerdown', () => {
      this.handleDump();
    });
  }

  private spawnOrder() {
    const tier = this.difficulty.currentTier;
    this.currentOrder = this.orderGen.generate(tier);
    this.glassState = [];
    this.glass.resetGlass();

    const tierCfg = this.config.tiers.find((t) => t.tier === tier);
    this.ticket.setOrder(this.currentOrder, this.ingredients);

    if (this.currentOrder.requirements.length === 1) {
      this.glass.setTarget(this.currentOrder.requirements[0].target);
    } else {
      let totalTarget = Fraction.zero();
      for (const req of this.currentOrder.requirements) {
        totalTarget = totalTarget.add(req.target);
      }
      this.glass.setTarget(totalTarget);
    }

    this.buildScoopPalette(tierCfg!.allowedDenominators);
    this.orderStartTime = Date.now();

    // Customer arrives
    this.customer.arrive();

    // Patience timer
    if (this.patienceTimer) this.patienceTimer.remove();
    this.patienceRemaining = this.currentOrder.patienceMs;
    this.events.emit('timer-start', this.currentOrder.patienceMs);

    this.patienceTimer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.patienceRemaining -= 100;
        this.events.emit('timer-update', this.patienceRemaining, this.currentOrder!.patienceMs);
        if (this.patienceRemaining <= 0) {
          this.handleTimeout();
        }
      },
    });

    // Hint check
    if (this.difficulty.shouldHint()) {
      this.showHint();
    }
  }

  private showHint() {
    if (!this.currentOrder) return;
    const req = this.currentOrder.requirements[0];
    const hint = this.add
      .text(LAYOUT.glass.x, LAYOUT.glass.y - 20, `Try reaching ${req.target.toMixedString()}!`, {
        fontFamily: FONTS.body,
        fontSize: '18px',
        color: '#FFB703',
        backgroundColor: '#3A2E39',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(95)
      .setAlpha(0);

    this.tweens.add({
      targets: hint,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: hint,
          alpha: 0,
          delay: 2500,
          duration: 500,
          onComplete: () => hint.destroy(),
        });
      },
    });
  }

  private buildScoopPalette(denominators: number[]) {
    for (const btn of this.scoopButtons) btn.destroy();
    this.scoopButtons = [];
    for (const btn of this.ingredientButtons) btn.destroy();
    this.ingredientButtons = [];

    const multiIngredient = this.currentOrder!.requirements.length > 1;

    if (multiIngredient) {
      this.selectedIngredientId = this.currentOrder!.requirements[0].ingredientId;
      this.buildIngredientSelector();
    } else {
      this.selectedIngredientId = this.currentOrder!.requirements[0].ingredientId;
    }

    const palette = LAYOUT.scoopPalette;
    const totalWidth = (denominators.length - 1) * palette.spacing;
    const startX = palette.x - totalWidth / 2;
    const ing = this.ingredients.find((i) => i.id === this.selectedIngredientId)!;

    denominators.forEach((d, i) => {
      const btn = new ScoopButton(
        this,
        startX + i * palette.spacing,
        palette.y,
        d,
        this.selectedIngredientId!,
        ing.colorHex,
      );
      btn.on('pointerdown', () => this.handlePour(d));
      this.scoopButtons.push(btn);
    });
  }

  private buildIngredientSelector() {
    const reqs = this.currentOrder!.requirements;
    const startX = GAME_WIDTH / 2 - ((reqs.length - 1) * 140) / 2;
    const y = LAYOUT.scoopPalette.y - 60;

    reqs.forEach((req, i) => {
      const ing = this.ingredients.find((ig) => ig.id === req.ingredientId)!;
      const container = this.add.container(startX + i * 140, y);

      const bg = this.add.graphics();
      const isSelected = req.ingredientId === this.selectedIngredientId;
      const color = hexStringToNumber(ing.colorHex);
      bg.fillStyle(color, isSelected ? 1 : 0.35);
      bg.fillRoundedRect(-55, -18, 110, 36, 10);
      bg.lineStyle(isSelected ? 3 : 2, COLORS.ink, isSelected ? 0.8 : 0.3);
      bg.strokeRoundedRect(-55, -18, 110, 36, 10);
      container.add(bg);

      const text = this.add
        .text(0, 0, ing.name, {
          fontFamily: FONTS.body,
          fontSize: '15px',
          color: '#FFFDF7',
          stroke: '#3A2E39',
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      container.add(text);

      container.setSize(110, 36);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        Sound.playTap();
        this.selectedIngredientId = req.ingredientId;
        this.rebuildScoopColors();
        this.rebuildIngredientHighlights();
      });

      this.ingredientButtons.push(container);
    });
  }

  private rebuildScoopColors() {
    const ing = this.ingredients.find((i) => i.id === this.selectedIngredientId)!;
    const denoms = this.scoopButtons.map((b) => b.fraction.den);
    for (const btn of this.scoopButtons) btn.destroy();
    this.scoopButtons = [];

    const palette = LAYOUT.scoopPalette;
    const totalWidth = (denoms.length - 1) * palette.spacing;
    const startX = palette.x - totalWidth / 2;

    denoms.forEach((d, i) => {
      const btn = new ScoopButton(
        this,
        startX + i * palette.spacing,
        palette.y,
        d,
        this.selectedIngredientId!,
        ing.colorHex,
      );
      btn.on('pointerdown', () => this.handlePour(d));
      this.scoopButtons.push(btn);
    });
  }

  private rebuildIngredientHighlights() {
    for (const btn of this.ingredientButtons) btn.destroy();
    this.ingredientButtons = [];
    this.buildIngredientSelector();
  }

  private handlePour(denominator: number) {
    if (!this.currentOrder) return;

    Sound.playPour();

    const pour: Pour = {
      ingredientId: this.selectedIngredientId!,
      amount: new Fraction(1, denominator),
    };
    this.glassState.push(pour);
    this.glass.updateFromState(this.glassState);
    this.glass.doWobble();

    // Pour particles
    const ing = this.ingredients.find((i) => i.id === this.selectedIngredientId)!;
    const bounds = this.glass.getGlassWorldBounds();
    this.particles.emitPourDroplets(
      bounds.x + bounds.width / 2,
      bounds.y + 20,
      hexStringToNumber(ing.colorHex),
    );

    const total = totalFill(this.glassState);
    if (total.value() > this.config.glass.capacityCups) {
      this.particles.emitSpill(bounds.x + bounds.width / 2, bounds.y + bounds.height);
    }
  }

  private handleServe() {
    if (!this.currentOrder) return;

    const timeMs = Date.now() - this.orderStartTime;
    const result = validateServe(this.glassState, this.currentOrder);

    if (result.success) {
      const reward = this.scoreManager.serveSuccess(
        this.currentOrder.tier,
        Math.max(0, this.patienceRemaining),
        this.currentOrder.patienceMs,
      );
      this.difficulty.record({ correct: true, timeMs });

      Sound.playSuccess(reward.comboAfter);
      if (reward.comboAfter > 1) Sound.playCombo(reward.comboAfter);

      // Visual juice
      const bounds = this.glass.getGlassWorldBounds();
      this.particles.emitConfetti(bounds.x + bounds.width / 2, bounds.y);
      this.particles.emitSparkle(bounds.x + bounds.width / 2, bounds.y - 20);
      this.particles.emitCoinFly(
        bounds.x + bounds.width / 2,
        bounds.y,
        LAYOUT.hud.scoreX - 200,
        LAYOUT.hud.heartsY,
        Math.min(reward.coinsAwarded, 6),
      );

      // Camera punch
      const intensity = Math.min(1.04 + reward.comboAfter * 0.003, 1.08);
      this.cameras.main.zoomTo(intensity, 80, 'Sine.easeIn');
      this.time.delayedCall(80, () => this.cameras.main.zoomTo(1, 80));

      this.customer.setHappy();

      this.events.emit('score-update', this.scoreManager.score, this.scoreManager.coins);
      this.events.emit('combo-update', this.scoreManager.combo);
      this.events.emit('tier-update', this.difficulty.currentTier);
      this.events.emit('serve-success', reward);

      if (this.patienceTimer) this.patienceTimer.remove();

      this.time.delayedCall(700, () => {
        this.customer.leave();
        this.time.delayedCall(300, () => this.spawnOrder());
      });
    } else {
      this.scoreManager.serveFail();
      this.difficulty.record({ correct: false, timeMs });

      Sound.playError();
      this.cameras.main.shake(200, 0.005);
      this.customer.setSad();

      this.events.emit('combo-update', 0);
      this.events.emit('tier-update', this.difficulty.currentTier);
      this.events.emit('serve-fail');

      this.loseHeart();
    }
  }

  private handleDump() {
    Sound.playDump();
    this.glassState = [];
    this.glass.updateFromState(this.glassState);
  }

  private handleTimeout() {
    if (this.patienceTimer) this.patienceTimer.remove();
    this.patienceTimer = null;
    this.scoreManager.serveFail();
    this.difficulty.record({ correct: false, timeMs: this.currentOrder!.patienceMs });

    Sound.playError();
    this.customer.setSad();
    this.loseHeart();

    this.events.emit('combo-update', 0);
    this.events.emit('tier-update', this.difficulty.currentTier);
  }

  private loseHeart() {
    this.lives--;
    Sound.playHeartLoss();
    this.events.emit('lives-update', this.lives);

    if (this.lives <= 0) {
      if (this.patienceTimer) this.patienceTimer.remove();
      this.cameras.main.fadeOut(600, 58, 46, 57);
      this.time.delayedCall(700, () => {
        this.scene.stop('HudScene');
        this.scene.start('ResultsScene', {
          score: this.scoreManager.score,
          bestScore: this.scoreManager.bestScore,
          tier: this.difficulty.currentTier,
          customers: this.scoreManager.customersServed,
          coins: this.scoreManager.coins,
        });
      });
    } else {
      if (this.patienceTimer) this.patienceTimer.remove();
      this.customer.leave();
      this.time.delayedCall(500, () => this.spawnOrder());
    }
  }
}

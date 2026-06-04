import Phaser from 'phaser';
import { Fraction } from '../core/Fraction';
import { RNG } from '../core/RNG';
import { OrderGenerator } from '../core/OrderGenerator';
import { DifficultyManager } from '../core/DifficultyManager';
import { ScoreManager } from '../core/ScoreManager';
import { ShopManager } from '../core/ShopManager';
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
import { RunState } from '../core/RunState';

interface GameSceneData {
  shop?: ShopManager;
  runState?: RunState;
  nodeId?: string;
  adventure?: boolean;
  customerCount?: number;
}

export class GameScene extends Phaser.Scene {
  private orderGen!: OrderGenerator;
  private difficulty!: DifficultyManager;
  scoreManager!: ScoreManager;
  private shop!: ShopManager;
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
  private isServing = false;

  private selectedIngredientId: string | null = null;
  private ingredientButtons: Phaser.GameObjects.Container[] = [];
  private debugCoinText!: Phaser.GameObjects.Text;
  private powerUpIndicators: Phaser.GameObjects.Text[] = [];

  // Adventure mode
  private adventureMode = false;
  private runState: RunState | null = null;
  private nodeId: string | null = null;
  private customerTarget = 0;
  private customersCompleted = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: GameSceneData) {
    this.config = this.registry.get('skillConfig') as SkillConfig;
    this.ingredients = this.config.ingredients;

    const rng = new RNG(Date.now());
    this.orderGen = new OrderGenerator(this.ingredients, this.config.tiers, rng);
    this.difficulty = new DifficultyManager(this.config.difficulty);
    this.scoreManager = new ScoreManager();
    this.scoreManager.reset();

    // Adventure mode setup
    this.adventureMode = data?.adventure ?? false;
    this.runState = data?.runState ?? null;
    this.nodeId = data?.nodeId ?? null;
    this.customerTarget = data?.customerCount ?? 0;
    this.customersCompleted = 0;

    // Shop integration
    this.shop = data?.shop ?? new ShopManager();

    this.lives = this.adventureMode && this.runState
      ? this.runState.lives
      : this.config.meta.lives;
    this.glassState = [];
    this.isServing = false;
    this.particles = new ParticleManager(this);

    // Apply purchased power-ups
    this.applyPurchasedItems();

    // Background
    if (this.textures.exists('bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg');
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
      bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      bg.fillGradientStyle(COLORS.wood, COLORS.woodLight, COLORS.woodDark, COLORS.wood);
      bg.fillRect(0, Math.round(GAME_HEIGHT * 0.75), GAME_WIDTH, Math.round(GAME_HEIGHT * 0.25));
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

    this.createServeButton();
    this.createDumpButton();
    this.createDebugBar();
    this.createPowerUpIndicators();

    this.scene.launch('HudScene');

    this.events.emit('lives-update', this.lives);
    this.events.emit('score-update', this.scoreManager.score, this.scoreManager.coins);
    this.events.emit('combo-update', this.scoreManager.combo);
    this.events.emit('tier-update', this.difficulty.currentTier);

    this.cameras.main.fadeIn(300);
    this.spawnOrder();
  }

  private applyPurchasedItems() {
    // Extra hearts
    const extraHearts = this.shop.getOwned('extra_heart');
    this.lives += extraHearts;

    // Time freeze → stored as active effect
    const timeFreezes = this.shop.getOwned('time_freeze');
    if (timeFreezes > 0) this.shop.activateEffect('time_freeze', timeFreezes);

    // Hint reveal → stored as active effect
    const hints = this.shop.getOwned('hint_reveal');
    if (hints > 0) this.shop.activateEffect('hint_reveal', hints);

    // Double points → stored as active effect (uses = orders)
    const doublePoints = this.shop.getOwned('double_points');
    if (doublePoints > 0) this.shop.activateEffect('double_points', doublePoints * 3);

    // Tip jar → permanent for this run
    if (this.shop.getOwned('tip_jar') > 0) this.shop.activateEffect('tip_jar', 999);
  }

  private createDebugBar() {
    const debugBg = this.add.graphics().setDepth(200);
    debugBg.fillStyle(0x000000, 0.5);
    debugBg.fillRoundedRect(GAME_WIDTH - 340, GAME_HEIGHT - 50, 330, 42, 8);

    this.debugCoinText = this.add
      .text(GAME_WIDTH - 260, GAME_HEIGHT - 29, `🪙 ${this.shop.coins}`, {
        fontFamily: FONTS.body,
        fontSize: '16px',
        color: '#FFB703',
      })
      .setOrigin(0, 0.5)
      .setDepth(201);

    const addBtn = this.add
      .text(GAME_WIDTH - 170, GAME_HEIGHT - 29, '[+100 coins]', {
        fontFamily: FONTS.body,
        fontSize: '16px',
        color: '#3CB371',
      })
      .setOrigin(0, 0.5)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });

    addBtn.on('pointerdown', () => {
      this.shop.addCoins(100);
      this.debugCoinText.setText(`🪙 ${this.shop.coins}`);
    });

    const shopBtn = this.add
      .text(GAME_WIDTH - 50, GAME_HEIGHT - 29, '[🛒]', {
        fontFamily: FONTS.body,
        fontSize: '16px',
        color: '#5B6CFF',
      })
      .setOrigin(0, 0.5)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });

    shopBtn.on('pointerdown', () => {
      if (this.patienceTimer) this.patienceTimer.remove();
      this.scene.stop('HudScene');
      this.scene.start('ShopScene', {
        shop: this.shop,
        returnScene: 'GameScene',
        returnData: { shop: this.shop },
      });
    });

    this.add
      .text(GAME_WIDTH - 330, GAME_HEIGHT - 29, 'DEBUG', {
        fontFamily: FONTS.body,
        fontSize: '12px',
        color: '#FF5E5B',
      })
      .setOrigin(0, 0.5)
      .setDepth(201);
  }

  private createPowerUpIndicators() {
    this.powerUpIndicators = [];
    const effects = [
      { id: 'time_freeze', icon: '⏱️', label: 'Freeze' },
      { id: 'hint_reveal', icon: '💡', label: 'Hints' },
      { id: 'double_points', icon: '⭐', label: '2x Pts' },
      { id: 'tip_jar', icon: '🫙', label: 'Tips' },
    ];

    let offsetX = 200;
    for (const eff of effects) {
      const count = this.shop.getActiveEffect(eff.id);
      if (count > 0) {
        const label = eff.id === 'tip_jar' ? `${eff.icon} ${eff.label}` : `${eff.icon} ${count}`;
        const txt = this.add
          .text(offsetX, LAYOUT.hud.heartsY, label, {
            fontFamily: FONTS.body,
            fontSize: '20px',
            color: '#FFB703',
            backgroundColor: '#3A2E39',
            padding: { x: 8, y: 3 },
          })
          .setOrigin(0, 0.5)
          .setDepth(150);
        this.powerUpIndicators.push(txt);
        offsetX += txt.width + 12;
      }
    }
  }

  private updatePowerUpIndicators() {
    for (const txt of this.powerUpIndicators) txt.destroy();
    this.createPowerUpIndicators();
  }

  private createServeButton() {
    const { x, y } = LAYOUT.serveButton;
    const container = this.add.container(x, y - 10);

    const g = this.add.graphics();
    g.fillStyle(COLORS.ink, 0.12);
    g.fillRoundedRect(-83, -23, 166, 50, 14);
    g.fillStyle(COLORS.mint, 1);
    g.fillRoundedRect(-80, -25, 160, 50, 14);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(-76, -22, 152, 22, { tl: 12, tr: 12, bl: 0, br: 0 });
    g.lineStyle(3, COLORS.ink, 0.7);
    g.strokeRoundedRect(-80, -25, 160, 50, 14);
    container.add(g);

    const text = this.add
      .text(0, 0, 'SERVE ✓', {
        fontFamily: FONTS.display,
        fontSize: '26px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    container.add(text);

    container.setSize(160, 50);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
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
    const container = this.add.container(x, y - 10);

    const g = this.add.graphics();
    g.fillStyle(COLORS.accent, 0.5);
    g.fillRoundedRect(-60, -16, 120, 32, 10);
    g.lineStyle(2, COLORS.ink, 0.4);
    g.strokeRoundedRect(-60, -16, 120, 32, 10);
    container.add(g);

    const text = this.add
      .text(0, 0, 'DUMP ✕', {
        fontFamily: FONTS.body,
        fontSize: '18px',
        color: '#FFFDF7',
      })
      .setOrigin(0.5);
    container.add(text);

    container.setSize(120, 32);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => this.handleDump());
  }

  private spawnOrder() {
    this.isServing = false;
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

    // Patience timer (with time freeze bonus)
    if (this.patienceTimer) this.patienceTimer.remove();
    let patience = this.currentOrder.patienceMs;
    if (this.shop.consumeEffect('time_freeze')) {
      patience += 5000;
      this.showFloatingText('⏱️ +5s!', LAYOUT.glass.x, LAYOUT.glass.y, '#5B6CFF');
      this.updatePowerUpIndicators();
    }
    this.patienceRemaining = patience;
    this.events.emit('timer-start', patience);

    this.patienceTimer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.patienceRemaining -= 100;
        this.events.emit('timer-update', this.patienceRemaining, patience);
        if (this.patienceRemaining <= 0) {
          this.handleTimeout();
        }
      },
    });

    // Auto-hint if purchased
    if (this.shop.hasEffect('hint_reveal') && this.difficulty.shouldHint()) {
      this.shop.consumeEffect('hint_reveal');
      this.showHintForOrder();
      this.updatePowerUpIndicators();
    } else if (this.difficulty.shouldHint()) {
      this.showHintForOrder();
    }
  }

  private showHintForOrder() {
    if (!this.currentOrder) return;
    const req = this.currentOrder.requirements[0];
    const hint = this.add
      .text(LAYOUT.glass.x, LAYOUT.glass.y - 20, `💡 Try reaching ${req.target.toMixedString()}!`, {
        fontFamily: FONTS.body,
        fontSize: '20px',
        color: '#FFB703',
        backgroundColor: '#3A2E39',
        padding: { x: 12, y: 5 },
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
          delay: 3000,
          duration: 500,
          onComplete: () => hint.destroy(),
        });
      },
    });
  }

  private showFloatingText(text: string, x: number, y: number, color: string) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONTS.display,
        fontSize: '28px',
        color,
        stroke: '#3A2E39',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => t.destroy(),
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
    const startX = GAME_WIDTH / 2 - ((reqs.length - 1) * 160) / 2;
    const y = LAYOUT.scoopPalette.y - 70;

    reqs.forEach((req, i) => {
      const ing = this.ingredients.find((ig) => ig.id === req.ingredientId)!;
      const container = this.add.container(startX + i * 160, y);

      const bg = this.add.graphics();
      const isSelected = req.ingredientId === this.selectedIngredientId;
      const color = hexStringToNumber(ing.colorHex);
      bg.fillStyle(color, isSelected ? 1 : 0.35);
      bg.fillRoundedRect(-65, -20, 130, 40, 12);
      bg.lineStyle(isSelected ? 3 : 2, COLORS.ink, isSelected ? 0.8 : 0.3);
      bg.strokeRoundedRect(-65, -20, 130, 40, 12);
      container.add(bg);

      const text = this.add
        .text(0, 0, ing.name, {
          fontFamily: FONTS.body,
          fontSize: '17px',
          color: '#FFFDF7',
          stroke: '#3A2E39',
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      container.add(text);

      container.setSize(130, 40);
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
    if (!this.currentOrder || this.isServing) return;

    Sound.playPour();

    const pour: Pour = {
      ingredientId: this.selectedIngredientId!,
      amount: new Fraction(1, denominator),
    };
    this.glassState.push(pour);
    this.glass.updateFromState(this.glassState);
    this.glass.doWobble();

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
    if (!this.currentOrder || this.isServing) return;
    if (this.glassState.length === 0) return;

    this.isServing = true;
    const timeMs = Date.now() - this.orderStartTime;
    const result = validateServe(this.glassState, this.currentOrder);

    if (result.success) {
      let reward = this.scoreManager.serveSuccess(
        this.currentOrder.tier,
        Math.max(0, this.patienceRemaining),
        this.currentOrder.patienceMs,
      );

      // Double points effect
      if (this.shop.consumeEffect('double_points')) {
        const bonusPoints = reward.points;
        this.scoreManager.addBonusScore(bonusPoints);
        reward = { ...reward, points: reward.points * 2 };
        this.showFloatingText('⭐ 2x!', LAYOUT.glass.x + 80, LAYOUT.glass.y, '#FFB703');
        this.updatePowerUpIndicators();
      }

      // Tip jar bonus coins
      let bonusCoins = 0;
      if (this.shop.hasEffect('tip_jar')) {
        bonusCoins = 2;
      }

      // Earn persistent coins
      const totalCoinsEarned = reward.coinsAwarded + bonusCoins;
      this.shop.addCoins(totalCoinsEarned);
      if (this.debugCoinText) this.debugCoinText.setText(`🪙 ${this.shop.coins}`);

      this.difficulty.record({ correct: true, timeMs });

      Sound.playSuccess(reward.comboAfter);
      if (reward.comboAfter > 1) Sound.playCombo(reward.comboAfter);

      const bounds = this.glass.getGlassWorldBounds();
      this.particles.emitConfetti(bounds.x + bounds.width / 2, bounds.y);
      this.particles.emitSparkle(bounds.x + bounds.width / 2, bounds.y - 20);
      this.particles.emitCoinFly(
        bounds.x + bounds.width / 2,
        bounds.y,
        LAYOUT.hud.scoreX - 200,
        LAYOUT.hud.heartsY,
        Math.min(totalCoinsEarned, 6),
      );

      const intensity = Math.min(1.04 + reward.comboAfter * 0.003, 1.08);
      this.cameras.main.zoomTo(intensity, 80, 'Sine.easeIn');
      this.time.delayedCall(80, () => this.cameras.main.zoomTo(1, 80));

      this.customer.setHappy();

      this.showFloatingText(`+${reward.points}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '#3CB371');

      this.events.emit('score-update', this.scoreManager.score, this.scoreManager.coins);
      this.events.emit('combo-update', this.scoreManager.combo);
      this.events.emit('tier-update', this.difficulty.currentTier);
      this.events.emit('serve-success', reward);

      if (this.patienceTimer) this.patienceTimer.remove();

      this.time.delayedCall(700, () => {
        this.customer.leave();
        this.customersCompleted++;

        // Adventure mode: return to map after N customers
        if (this.adventureMode && this.customerTarget > 0 && this.customersCompleted >= this.customerTarget) {
          this.time.delayedCall(300, () => this.handleAdventureComplete());
          return;
        }

        this.time.delayedCall(300, () => this.spawnOrder());
      });
    } else {
      this.isServing = false;
      this.scoreManager.serveFail();
      this.difficulty.record({ correct: false, timeMs });

      Sound.playError();
      this.cameras.main.shake(200, 0.005);
      this.customer.setSad();

      const msg =
        result.reason === 'over'
          ? 'TOO MUCH!'
          : result.reason === 'under'
            ? 'NOT ENOUGH!'
            : result.reason === 'extra-ingredient'
              ? 'WRONG MIX!'
              : result.reason === 'wrong-ingredient'
                ? 'MISSING!'
                : 'WRONG!';
      this.showFloatingText(msg, GAME_WIDTH / 2, GAME_HEIGHT / 2, '#FF5E5B');

      this.events.emit('combo-update', 0);
      this.events.emit('tier-update', this.difficulty.currentTier);
      this.events.emit('serve-fail');

      this.loseHeart();
    }
  }

  private handleDump() {
    if (this.isServing) return;
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
    this.showFloatingText('TIME UP!', GAME_WIDTH / 2, GAME_HEIGHT / 2, '#FFB703');
    this.loseHeart();

    this.events.emit('combo-update', 0);
    this.events.emit('tier-update', this.difficulty.currentTier);
  }

  private handleAdventureComplete() {
    if (this.patienceTimer) this.patienceTimer.remove();
    this.scene.stop('HudScene');

    const earnedCoins = this.scoreManager.coins;
    this.shop.addCoins(earnedCoins);
    if (this.runState) {
      this.runState.addScore(this.scoreManager.score);
    }

    this.cameras.main.fadeOut(300);
    this.time.delayedCall(400, () => {
      this.scene.start('MapScene', { runState: this.runState });
    });
  }

  private loseHeart() {
    this.lives--;
    Sound.playHeartLoss();
    this.events.emit('lives-update', this.lives);

    // Sync lives back to run state
    if (this.adventureMode && this.runState) {
      this.runState.lives = this.lives;
    }

    if (this.lives <= 0) {
      if (this.patienceTimer) this.patienceTimer.remove();
      this.cameras.main.fadeOut(600, 58, 46, 57);
      this.time.delayedCall(700, () => {
        this.scene.stop('HudScene');
        if (this.adventureMode && this.runState) {
          this.scene.start('ResultsScene', {
            score: this.runState.score + this.scoreManager.score,
            bestScore: 0,
            tier: 0,
            customers: this.scoreManager.customersServed,
            coins: this.scoreManager.coins,
            persistentCoins: this.shop.coins,
            adventure: true,
          });
        } else {
          this.scene.start('ResultsScene', {
            score: this.scoreManager.score,
            bestScore: this.scoreManager.bestScore,
            tier: this.difficulty.currentTier,
            customers: this.scoreManager.customersServed,
            coins: this.scoreManager.coins,
            persistentCoins: this.shop.coins,
          });
        }
      });
    } else {
      if (this.patienceTimer) this.patienceTimer.remove();
      this.customer.leave();
      this.time.delayedCall(500, () => this.spawnOrder());
    }
  }
}

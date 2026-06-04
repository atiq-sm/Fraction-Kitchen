import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { RunState } from '../core/RunState';
import type { MapNode, NodeType } from '../core/MapGenerator';
import { getDifficultyForRow } from '../core/MapGenerator';
import { playTap, playSuccess, playLevelUp } from '../audio/SoundSynth';

const NODE_COLORS: Record<NodeType, number> = {
  start: COLORS.mint,
  addition: 0x4ecdc4,
  subtraction: 0xff6b6b,
  multiplication: 0xffd93d,
  fractions: COLORS.blue,
  boss: 0xff0055,
  shop: COLORS.mango,
  chest: 0xc9b037,
  rest: 0x95e1d3,
};

const NODE_ICONS: Record<NodeType, string> = {
  start: '🏠',
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  fractions: '🥤',
  boss: '💀',
  shop: '🛒',
  chest: '🎁',
  rest: '💤',
};

const NODE_LABELS: Record<NodeType, string> = {
  start: 'Start',
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiply',
  fractions: 'Fractions',
  boss: 'BOSS',
  shop: 'Shop',
  chest: 'Chest',
  rest: 'Rest',
};

const MAP_OFFSET_X = (GAME_WIDTH - 800) / 2;
const MAP_OFFSET_Y = 100;

export class MapScene extends Phaser.Scene {
  private runState!: RunState;
  private nodeGraphics: Map<string, Phaser.GameObjects.Container> = new Map();
  private livesText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MapScene' });
  }

  create(data?: { runState?: RunState }) {
    this.runState = data?.runState ?? new RunState();
    this.nodeGraphics.clear();

    // Auto-complete start node BEFORE drawing so available nodes render correctly
    if (!this.runState.currentNodeId) {
      this.runState.completeNode('node_0_0');
    }

    this.drawBackground();
    this.drawHud();
    this.drawConnections();
    this.drawNodes();

    this.cameras.main.fadeIn(300);

    // Check for game over
    if (this.runState.isGameOver()) {
      this.time.delayedCall(500, () => {
        this.scene.start('ResultsScene', {
          score: this.runState.score,
          bestScore: 0,
          tier: 0,
          customers: 0,
          coins: 0,
          persistentCoins: this.runState.shop.coins,
          adventure: true,
        });
      });
    }
  }

  private drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, GAME_WIDTH);
      const sy = Phaser.Math.Between(0, GAME_HEIGHT);
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      bg.fillCircle(sx, sy, Phaser.Math.Between(1, 2));
    }

    // Title
    this.add
      .text(GAME_WIDTH / 2, 40, 'Math Kitchen Adventure', {
        fontFamily: FONTS.display,
        fontSize: '40px',
        color: '#FFD8A8',
        stroke: '#1a1a2e',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  private drawHud() {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.4);
    hudBg.fillRoundedRect(20, 70, GAME_WIDTH - 40, 40, 8);

    this.livesText = this.add
      .text(50, 90, `❤️ ${this.runState.lives}`, {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: '#FF5E5B',
      })
      .setOrigin(0, 0.5);

    this.scoreText = this.add
      .text(GAME_WIDTH / 2, 90, `Score: ${this.runState.score}`, {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: '#FFD8A8',
      })
      .setOrigin(0.5);

    this.coinsText = this.add
      .text(GAME_WIDTH - 50, 90, `🪙 ${this.runState.shop.coins}`, {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: '#FFB703',
      })
      .setOrigin(1, 0.5);
  }

  private drawConnections() {
    const g = this.add.graphics();

    this.runState.map.nodes.forEach((node) => {
      for (const targetId of node.connections) {
        const target = this.runState.map.nodes.get(targetId);
        if (!target) continue;

        const isAvailable = this.isNodeAvailable(targetId);
        const isCompleted = node.completed && target.completed;
        if (isAvailable) {
          g.lineStyle(5, 0xffd8a8, 0.9);
        } else if (isCompleted) {
          g.lineStyle(4, 0x667799, 0.5);
        } else {
          g.lineStyle(3, 0x556688, 0.35);
        }
        g.lineBetween(
          node.x + MAP_OFFSET_X,
          node.y + MAP_OFFSET_Y,
          target.x + MAP_OFFSET_X,
          target.y + MAP_OFFSET_Y,
        );
      }
    });
  }

  private drawNodes() {
    this.runState.map.nodes.forEach((node) => {
      const wx = node.x + MAP_OFFSET_X;
      const wy = node.y + MAP_OFFSET_Y;
      const isAvailable = this.isNodeAvailable(node.id);
      const isCurrent = node.id === this.runState.currentNodeId;
      const isCompleted = node.completed;

      const container = this.add.container(wx, wy);

      // Node circle
      const g = this.add.graphics();
      const radius = node.type === 'boss' ? 36 : 28;

      if (isCompleted) {
        g.fillStyle(0x333355, 0.6);
        g.fillCircle(0, 0, radius);
        g.lineStyle(2, 0x555577, 0.5);
        g.strokeCircle(0, 0, radius);
      } else if (isAvailable) {
        // Glow
        g.fillStyle(NODE_COLORS[node.type], 0.2);
        g.fillCircle(0, 0, radius + 10);
        g.fillStyle(NODE_COLORS[node.type], 1);
        g.fillCircle(0, 0, radius);
        g.fillStyle(0xffffff, 0.2);
        g.fillCircle(-4, -4, radius * 0.6);
        g.lineStyle(3, 0xffffff, 0.6);
        g.strokeCircle(0, 0, radius);
      } else {
        g.fillStyle(NODE_COLORS[node.type], 0.4);
        g.fillCircle(0, 0, radius);
        g.lineStyle(2, 0x666688, 0.4);
        g.strokeCircle(0, 0, radius);
      }

      if (isCurrent) {
        g.lineStyle(3, 0xffd700, 1);
        g.strokeCircle(0, 0, radius + 4);
      }

      container.add(g);

      // Icon
      const icon = this.add
        .text(0, -2, NODE_ICONS[node.type], {
          fontSize: node.type === 'boss' ? '28px' : '22px',
        })
        .setOrigin(0.5);
      container.add(icon);

      // Label below
      if (!isCompleted) {
        const label = this.add
          .text(0, radius + 14, NODE_LABELS[node.type], {
            fontFamily: FONTS.body,
            fontSize: '13px',
            color: isAvailable ? '#FFD8A8' : '#666688',
          })
          .setOrigin(0.5);
        container.add(label);
      }

      // Make available nodes interactive
      if (isAvailable) {
        container.setSize(radius * 2 + 20, radius * 2 + 20);
        container.setInteractive({ useHandCursor: true });
        container.on('pointerdown', () => this.selectNode(node));
        container.on('pointerover', () => container.setScale(1.1));
        container.on('pointerout', () => container.setScale(1));

        // Pulse animation
        this.tweens.add({
          targets: container,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      this.nodeGraphics.set(node.id, container);
    });
  }

  private isNodeAvailable(nodeId: string): boolean {
    const available = this.runState.getAvailableNodes();
    return available.includes(nodeId);
  }

  private selectNode(node: MapNode) {
    playTap();
    const difficulty = getDifficultyForRow(node.row);

    switch (node.type) {
      case 'addition':
      case 'subtraction':
      case 'multiplication':
        this.scene.start('MathBattleScene', {
          runState: this.runState,
          nodeId: node.id,
          mathType: node.type,
          difficulty,
          problemCount: 3,
          isBoss: false,
        });
        break;

      case 'fractions':
        this.runState.completeNode(node.id);
        this.scene.start('GameScene', {
          runState: this.runState,
          nodeId: node.id,
          adventure: true,
          customerCount: 3,
          shop: this.runState.shop,
        });
        break;

      case 'boss':
        this.scene.start('MathBattleScene', {
          runState: this.runState,
          nodeId: node.id,
          mathType: 'mixed' as 'addition',
          difficulty: 5,
          problemCount: 5,
          isBoss: true,
        });
        break;

      case 'shop':
        this.runState.completeNode(node.id);
        this.scene.start('ShopScene', {
          shop: this.runState.shop,
          returnScene: 'MapScene',
          returnData: { runState: this.runState },
        });
        break;

      case 'chest':
        this.handleChest(node);
        break;

      case 'rest':
        this.handleRest(node);
        break;
    }
  }

  private handleChest(node: MapNode) {
    playSuccess(0);
    this.runState.completeNode(node.id);
    const reward = Phaser.Math.Between(20, 50);
    this.runState.shop.addCoins(reward);

    this.showPopup(`🎁 Found ${reward} coins!`, '#FFB703', () => {
      this.scene.restart({ runState: this.runState });
    });
  }

  private handleRest(node: MapNode) {
    playLevelUp();
    this.runState.completeNode(node.id);
    this.runState.heal(1);

    this.showPopup(`💤 Healed! ❤️ ${this.runState.lives}/${this.runState.maxLives}`, '#3CB371', () => {
      this.scene.restart({ runState: this.runState });
    });
  }

  private showPopup(text: string, color: string, onDone: () => void) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const overlay = this.add.graphics().setDepth(300);
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics().setDepth(301);
    panel.fillStyle(COLORS.cream, 0.97);
    panel.fillRoundedRect(cx - 250, cy - 80, 500, 160, 20);
    panel.lineStyle(3, COLORS.ink, 0.6);
    panel.strokeRoundedRect(cx - 250, cy - 80, 500, 160, 20);

    const label = this.add
      .text(cx, cy - 15, text, {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color,
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(302);

    const btn = this.add
      .text(cx, cy + 45, 'Continue', {
        fontFamily: FONTS.display,
        fontSize: '24px',
        color: '#FF5E5B',
      })
      .setOrigin(0.5)
      .setDepth(302)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      label.destroy();
      btn.destroy();
      onDone();
    });
  }
}

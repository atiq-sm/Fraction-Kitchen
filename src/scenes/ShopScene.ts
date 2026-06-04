import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { ShopManager, SHOP_ITEMS } from '../core/ShopManager';
import { playTap, playSuccess } from '../audio/SoundSynth';

export class ShopScene extends Phaser.Scene {
  private shop!: ShopManager;
  private coinText!: Phaser.GameObjects.Text;
  private itemButtons: Array<{
    container: Phaser.GameObjects.Container;
    cardBg: Phaser.GameObjects.Graphics;
    btnBg: Phaser.GameObjects.Graphics;
    costText: Phaser.GameObjects.Text;
    ownedText: Phaser.GameObjects.Text;
    itemId: string;
  }> = [];
  private returnScene = 'MenuScene';
  private returnData: Record<string, unknown> = {};

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(data: { shop: ShopManager; returnScene: string; returnData?: Record<string, unknown> }) {
    this.shop = data.shop;
    this.returnScene = data.returnScene || 'MenuScene';
    this.returnData = data.returnData || {};
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    if (this.textures.exists('bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg').setAlpha(0.4);
    }
    const overlay = this.add.graphics();
    overlay.fillStyle(COLORS.ink, 0.4);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const pw = 900;
    const ph = 750;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.97);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 24);
    panel.lineStyle(4, COLORS.ink, 0.6);
    panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 24);

    panel.fillStyle(COLORS.mango, 0.95);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, 70, { tl: 24, tr: 24, bl: 0, br: 0 });

    const panelTop = cy - ph / 2;

    this.add
      .text(cx - 100, panelTop + 35, '🛒 SHOP', {
        fontFamily: FONTS.display,
        fontSize: '36px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(cx + 200, panelTop + 35, `🪙 ${this.shop.coins}`, {
        fontFamily: FONTS.display,
        fontSize: '30px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    const itemsPerRow = 3;
    const itemW = 250;
    const itemH = 240;
    const gapX = 20;
    const gapY = 20;
    const gridW = itemsPerRow * itemW + (itemsPerRow - 1) * gapX;
    const gridStartX = cx - gridW / 2 + itemW / 2;
    const gridStartY = panelTop + 110 + itemH / 2;

    this.itemButtons = [];

    SHOP_ITEMS.forEach((item, i) => {
      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);
      const ix = gridStartX + col * (itemW + gapX);
      const iy = gridStartY + row * (itemH + gapY);
      const canBuy = this.shop.canBuy(item.id);

      const container = this.add.container(ix, iy);

      // Card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(canBuy ? COLORS.surface : 0xdddddd, 1);
      cardBg.fillRoundedRect(-itemW / 2, -itemH / 2, itemW, itemH, 14);
      cardBg.lineStyle(3, canBuy ? COLORS.ink : 0xaaaaaa, 0.6);
      cardBg.strokeRoundedRect(-itemW / 2, -itemH / 2, itemW, itemH, 14);
      container.add(cardBg);

      // Icon — store reference, add explicitly
      const iconText = this.add
        .text(0, -itemH / 2 + 40, item.icon, { fontSize: '48px' })
        .setOrigin(0.5);
      container.add(iconText);

      // Name
      const nameText = this.add
        .text(0, -itemH / 2 + 90, item.name, {
          fontFamily: FONTS.display,
          fontSize: '22px',
          color: '#3A2E39',
        })
        .setOrigin(0.5);
      container.add(nameText);

      // Description
      const descText = this.add
        .text(0, -itemH / 2 + 118, item.description, {
          fontFamily: FONTS.body,
          fontSize: '15px',
          color: '#666666',
          wordWrap: { width: itemW - 30 },
          align: 'center',
        })
        .setOrigin(0.5, 0);
      container.add(descText);

      // Owned count
      const ownedText = this.add
        .text(itemW / 2 - 15, -itemH / 2 + 15, `${this.shop.getOwned(item.id)}/${item.maxOwned}`, {
          fontFamily: FONTS.body,
          fontSize: '14px',
          color: '#999999',
        })
        .setOrigin(1, 0.5);
      container.add(ownedText);

      // Buy button
      const btnY = itemH / 2 - 35;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(canBuy ? COLORS.mint : 0xaaaaaa, 1);
      btnBg.fillRoundedRect(-60, btnY - 18, 120, 36, 10);
      if (canBuy) {
        btnBg.fillStyle(0xffffff, 0.15);
        btnBg.fillRoundedRect(-56, btnY - 15, 112, 15, { tl: 8, tr: 8, bl: 0, br: 0 });
      }
      container.add(btnBg);

      const costText = this.add
        .text(0, btnY, `🪙 ${item.cost}`, {
          fontFamily: FONTS.display,
          fontSize: '20px',
          color: canBuy ? '#FFFDF7' : '#777777',
        })
        .setOrigin(0.5);
      container.add(costText);

      container.setSize(itemW, itemH);
      container.setInteractive({ useHandCursor: canBuy });

      if (canBuy) {
        container.on('pointerdown', () => this.handleBuy(item.id));
        container.on('pointerover', () => container.setScale(1.03));
        container.on('pointerout', () => container.setScale(1));
      }

      this.itemButtons.push({ container, cardBg, btnBg, costText, ownedText, itemId: item.id });
    });

    // Continue button
    const contY = panelTop + ph - 50;
    const contBg = this.add.graphics();
    contBg.fillStyle(COLORS.accent, 1);
    contBg.fillRoundedRect(cx - 140, contY - 28, 280, 56, 16);
    contBg.fillStyle(0xffffff, 0.15);
    contBg.fillRoundedRect(cx - 136, contY - 24, 272, 24, { tl: 14, tr: 14, bl: 0, br: 0 });
    contBg.lineStyle(3, COLORS.ink, 0.7);
    contBg.strokeRoundedRect(cx - 140, contY - 28, 280, 56, 16);

    this.add
      .text(cx, contY, 'Continue →', {
        fontFamily: FONTS.display,
        fontSize: '28px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .zone(cx, contY, 280, 56)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        playTap();
        this.scene.start(this.returnScene, this.returnData);
      });

    this.cameras.main.fadeIn(200);
  }

  private handleBuy(itemId: string) {
    if (!this.shop.canBuy(itemId)) return;
    playTap();

    if (this.shop.buy(itemId)) {
      playSuccess(0);
      this.coinText.setText(`🪙 ${this.shop.coins}`);
      this.refreshItems();
    }
  }

  private refreshItems() {
    for (const btn of this.itemButtons) {
      const item = SHOP_ITEMS.find((i) => i.id === btn.itemId)!;
      const canBuy = this.shop.canBuy(btn.itemId);

      btn.ownedText.setText(`${this.shop.getOwned(btn.itemId)}/${item.maxOwned}`);
      btn.costText.setColor(canBuy ? '#FFFDF7' : '#777777');

      if (canBuy) {
        btn.container.setInteractive({ useHandCursor: true });
      } else {
        btn.container.disableInteractive();
      }
    }
  }
}

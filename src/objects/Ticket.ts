import Phaser from 'phaser';
import type { Order } from '../core/types';
import type { Ingredient } from '../core/types';
import { COLORS, FONTS } from '../config/constants';

const TICKET_WIDTH = 280;
const TICKET_HEIGHT = 160;

export class Ticket extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private contentTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.bg = scene.add.graphics();
    this.drawTicketBg();
    this.add(this.bg);

    scene.add.existing(this);
  }

  private drawTicketBg() {
    const hw = TICKET_WIDTH / 2;
    const hh = TICKET_HEIGHT / 2;

    // Shadow
    this.bg.fillStyle(COLORS.ink, 0.1);
    this.bg.fillRoundedRect(-hw + 4, -hh + 4, TICKET_WIDTH, TICKET_HEIGHT, 12);

    // Main card
    this.bg.fillStyle(COLORS.cream, 1);
    this.bg.fillRoundedRect(-hw, -hh, TICKET_WIDTH, TICKET_HEIGHT, 12);

    // Border
    this.bg.lineStyle(3, COLORS.ink, 0.7);
    this.bg.strokeRoundedRect(-hw, -hh, TICKET_WIDTH, TICKET_HEIGHT, 12);

    // Header stripe
    this.bg.fillStyle(COLORS.accent, 0.9);
    this.bg.fillRoundedRect(-hw, -hh, TICKET_WIDTH, 36, { tl: 12, tr: 12, bl: 0, br: 0 });
  }

  setOrder(order: Order, ingredients: Ingredient[]) {
    for (const t of this.contentTexts) t.destroy();
    this.contentTexts = [];

    const hw = TICKET_WIDTH / 2;
    const hh = TICKET_HEIGHT / 2;

    const title = this.scene.add
      .text(0, -hh + 18, 'ORDER', {
        fontFamily: FONTS.display,
        fontSize: '18px',
        color: '#FFFDF7',
      })
      .setOrigin(0.5);
    this.add(title);
    this.contentTexts.push(title);

    let yOff = -hh + 54;
    for (const req of order.requirements) {
      const ing = ingredients.find((i) => i.id === req.ingredientId);
      const name = ing ? ing.name : req.ingredientId;
      const text = this.scene.add
        .text(-hw + 20, yOff, `${req.target.toMixedString()} cup ${name}`, {
          fontFamily: FONTS.body,
          fontSize: '22px',
          color: '#3A2E39',
        })
        .setOrigin(0, 0);
      this.add(text);
      this.contentTexts.push(text);
      yOff += 32;
    }

    const tierText = this.scene.add
      .text(hw - 20, -hh + 18, `Tier ${order.tier}`, {
        fontFamily: FONTS.body,
        fontSize: '14px',
        color: '#FFFDF7',
      })
      .setOrigin(1, 0.5);
    this.add(tierText);
    this.contentTexts.push(tierText);
  }

  clearOrder() {
    for (const t of this.contentTexts) t.destroy();
    this.contentTexts = [];
  }
}

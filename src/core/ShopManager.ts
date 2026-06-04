export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  maxOwned: number;
}

export interface OwnedPowerUp {
  itemId: string;
  uses: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'extra_heart',
    name: 'Extra Heart',
    description: '+1 life this run',
    cost: 50,
    icon: '❤️',
    maxOwned: 2,
  },
  {
    id: 'time_freeze',
    name: 'Time Freeze',
    description: '+5s patience on next order',
    cost: 30,
    icon: '⏱️',
    maxOwned: 3,
  },
  {
    id: 'hint_reveal',
    name: 'Hint Reveal',
    description: 'Shows a valid first scoop',
    cost: 20,
    icon: '💡',
    maxOwned: 5,
  },
  {
    id: 'double_points',
    name: 'Double Points',
    description: '2x score for next 3 orders',
    cost: 40,
    icon: '⭐',
    maxOwned: 2,
  },
  {
    id: 'tip_jar',
    name: 'Tip Jar',
    description: '+2 coins per serve this run',
    cost: 60,
    icon: '🫙',
    maxOwned: 1,
  },
];

const STORAGE_KEY = 'fk_coins';

export class ShopManager {
  private _coins: number;
  private _owned: Map<string, number> = new Map();
  private _activeEffects: Map<string, number> = new Map();

  constructor() {
    this._coins = this.loadCoins();
  }

  get coins(): number {
    return this._coins;
  }

  addCoins(n: number) {
    this._coins += n;
    this.saveCoins();
  }

  setCoins(n: number) {
    this._coins = n;
    this.saveCoins();
  }

  canBuy(itemId: string): boolean {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;
    const owned = this._owned.get(itemId) ?? 0;
    return this._coins >= item.cost && owned < item.maxOwned;
  }

  buy(itemId: string): boolean {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item || !this.canBuy(itemId)) return false;

    this._coins -= item.cost;
    this._owned.set(itemId, (this._owned.get(itemId) ?? 0) + 1);
    this.saveCoins();
    return true;
  }

  getOwned(itemId: string): number {
    return this._owned.get(itemId) ?? 0;
  }

  useItem(itemId: string): boolean {
    const owned = this._owned.get(itemId) ?? 0;
    if (owned <= 0) return false;
    this._owned.set(itemId, owned - 1);
    return true;
  }

  activateEffect(effectId: string, uses: number) {
    const current = this._activeEffects.get(effectId) ?? 0;
    this._activeEffects.set(effectId, current + uses);
  }

  getActiveEffect(effectId: string): number {
    return this._activeEffects.get(effectId) ?? 0;
  }

  consumeEffect(effectId: string): boolean {
    const current = this._activeEffects.get(effectId) ?? 0;
    if (current <= 0) return false;
    this._activeEffects.set(effectId, current - 1);
    return true;
  }

  hasEffect(effectId: string): boolean {
    return (this._activeEffects.get(effectId) ?? 0) > 0;
  }

  resetForNewRun() {
    this._owned.clear();
    this._activeEffects.clear();
  }

  private loadCoins(): number {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  private saveCoins() {
    try {
      localStorage.setItem(STORAGE_KEY, String(this._coins));
    } catch {
      // unavailable
    }
  }
}

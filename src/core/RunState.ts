import { GameMap, generateMap } from './MapGenerator';
import { ShopManager } from './ShopManager';

export class RunState {
  map: GameMap;
  currentNodeId: string | null = null;
  lives: number;
  maxLives: number;
  score: number;
  shop: ShopManager;
  completedNodes: Set<string> = new Set();
  bossDefeated = false;
  seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
    this.map = generateMap(this.seed);
    this.lives = 4;
    this.maxLives = 5;
    this.score = 0;
    this.shop = new ShopManager();
  }

  completeNode(nodeId: string) {
    this.completedNodes.add(nodeId);
    const node = this.map.nodes.get(nodeId);
    if (node) {
      node.completed = true;
      this.currentNodeId = nodeId;
    }
  }

  loseLife(): boolean {
    this.lives--;
    return this.lives <= 0;
  }

  heal(amount: number) {
    this.lives = Math.min(this.lives + amount, this.maxLives);
  }

  addScore(points: number) {
    this.score += points;
  }

  isGameOver(): boolean {
    return this.lives <= 0;
  }

  getAvailableNodes(): string[] {
    if (!this.currentNodeId) {
      return ['node_0_0'];
    }
    const current = this.map.nodes.get(this.currentNodeId);
    if (!current) return [];
    return current.connections.filter((id) => {
      const node = this.map.nodes.get(id);
      return node && !node.completed;
    });
  }
}

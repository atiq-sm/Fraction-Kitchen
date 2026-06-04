import { RNG } from './RNG';

export type NodeType =
  | 'start'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'fractions'
  | 'boss'
  | 'shop'
  | 'chest'
  | 'rest';

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  connections: string[];
  completed: boolean;
  x: number;
  y: number;
}

export interface GameMap {
  nodes: Map<string, MapNode>;
  rows: number;
  seed: number;
}

const ROW_NODE_TYPES: Record<number, { pool: NodeType[]; weights: number[] }> = {
  1: { pool: ['addition', 'subtraction', 'chest'], weights: [4, 4, 2] },
  2: { pool: ['addition', 'subtraction', 'multiplication', 'rest'], weights: [3, 3, 3, 1] },
  3: { pool: ['multiplication', 'fractions', 'addition', 'shop'], weights: [3, 3, 2, 2] },
  4: { pool: ['fractions', 'multiplication', 'subtraction', 'chest'], weights: [4, 3, 2, 1] },
  5: { pool: ['fractions', 'multiplication', 'shop', 'rest'], weights: [3, 3, 2, 2] },
};

function weightedPick(rng: RNG, items: NodeType[], weights: number[]): NodeType {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.float() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function generateMap(seed: number): GameMap {
  const rng = new RNG(seed);
  const nodes = new Map<string, MapNode>();
  const totalRows = 7;
  const mapWidth = 800;
  const mapHeight = 900;
  const rowSpacing = mapHeight / (totalRows - 1);

  // Row 0: start node
  const startNode: MapNode = {
    id: 'node_0_0',
    row: 0,
    col: 0,
    type: 'start',
    connections: [],
    completed: false,
    x: mapWidth / 2,
    y: 20,
  };
  nodes.set(startNode.id, startNode);

  // Rows 1-5: encounter nodes
  const rowNodes: string[][] = [['node_0_0']];

  for (let row = 1; row <= 5; row++) {
    const nodeCount = rng.int(2, 4);
    const rowIds: string[] = [];
    const spacing = mapWidth / (nodeCount + 1);

    for (let col = 0; col < nodeCount; col++) {
      const config = ROW_NODE_TYPES[row];
      const type = weightedPick(rng, config.pool, config.weights);
      const id = `node_${row}_${col}`;
      const x = spacing * (col + 1) + rng.int(-30, 30);
      const y = row * rowSpacing + rng.int(-15, 15);

      nodes.set(id, {
        id,
        row,
        col,
        type,
        connections: [],
        completed: false,
        x,
        y,
      });
      rowIds.push(id);
    }
    rowNodes.push(rowIds);
  }

  // Row 6: boss node
  const bossNode: MapNode = {
    id: 'node_6_0',
    row: 6,
    col: 0,
    type: 'boss',
    connections: [],
    completed: false,
    x: mapWidth / 2,
    y: 6 * rowSpacing,
  };
  nodes.set(bossNode.id, bossNode);
  rowNodes.push(['node_6_0']);

  // Generate connections between adjacent rows
  for (let row = 0; row < rowNodes.length - 1; row++) {
    const currentRow = rowNodes[row];
    const nextRow = rowNodes[row + 1];

    // Each node in current row connects to 1-2 nodes in next row
    for (const nodeId of currentRow) {
      const node = nodes.get(nodeId)!;
      const connectCount = Math.min(rng.int(1, 2), nextRow.length);
      const targets = rng.pickDistinct(nextRow, connectCount);
      node.connections.push(...targets);
    }

    // Ensure every next-row node has at least one incoming connection
    for (const nextId of nextRow) {
      const hasIncoming = currentRow.some((cId) => {
        const cNode = nodes.get(cId)!;
        return cNode.connections.includes(nextId);
      });
      if (!hasIncoming) {
        const randomParent = rng.pick(currentRow);
        nodes.get(randomParent)!.connections.push(nextId);
      }
    }
  }

  return { nodes, rows: totalRows, seed };
}

export function getAvailableNodes(map: GameMap, currentNodeId: string | null): string[] {
  if (!currentNodeId) {
    return ['node_0_0'];
  }
  const current = map.nodes.get(currentNodeId);
  if (!current) return [];
  return current.connections.filter((id) => {
    const node = map.nodes.get(id);
    return node && !node.completed;
  });
}

export function getDifficultyForRow(row: number): number {
  return Math.min(row, 5);
}

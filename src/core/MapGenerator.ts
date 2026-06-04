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
  2: { pool: ['multiplication', 'fractions', 'shop', 'rest'], weights: [3, 3, 2, 2] },
  3: { pool: ['fractions', 'multiplication', 'subtraction'], weights: [4, 3, 3] },
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
  const totalRows = 5;
  const mapWidth = 700;
  const mapHeight = 800;
  const rowSpacing = mapHeight / (totalRows - 1);

  // Row 0: start
  const startNode: MapNode = {
    id: 'node_0_0',
    row: 0,
    col: 0,
    type: 'start',
    connections: [],
    completed: false,
    x: mapWidth / 2,
    y: 30,
  };
  nodes.set(startNode.id, startNode);

  const rowNodes: string[][] = [['node_0_0']];

  // Rows 1-3: encounters (2-3 nodes each)
  for (let row = 1; row <= 3; row++) {
    const nodeCount = rng.int(2, 3);
    const rowIds: string[] = [];
    const spacing = mapWidth / (nodeCount + 1);

    for (let col = 0; col < nodeCount; col++) {
      const config = ROW_NODE_TYPES[row];
      const type = weightedPick(rng, config.pool, config.weights);
      const id = `node_${row}_${col}`;
      const x = spacing * (col + 1);
      const y = row * rowSpacing;

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

  // Row 4: boss
  const bossNode: MapNode = {
    id: `node_${totalRows - 1}_0`,
    row: totalRows - 1,
    col: 0,
    type: 'boss',
    connections: [],
    completed: false,
    x: mapWidth / 2,
    y: (totalRows - 1) * rowSpacing,
  };
  nodes.set(bossNode.id, bossNode);
  rowNodes.push([bossNode.id]);

  // Connections: each node connects to 1 node in next row (clean paths)
  for (let row = 0; row < rowNodes.length - 1; row++) {
    const currentRow = rowNodes[row];
    const nextRow = rowNodes[row + 1];

    for (const nodeId of currentRow) {
      const node = nodes.get(nodeId)!;
      const target = rng.pick(nextRow);
      if (!node.connections.includes(target)) {
        node.connections.push(target);
      }
    }

    // Ensure every next-row node has at least one parent
    for (const nextId of nextRow) {
      const hasIncoming = currentRow.some((cId) =>
        nodes.get(cId)!.connections.includes(nextId),
      );
      if (!hasIncoming) {
        const parent = rng.pick(currentRow);
        if (!nodes.get(parent)!.connections.includes(nextId)) {
          nodes.get(parent)!.connections.push(nextId);
        }
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
  return Math.min(row + 1, 5);
}

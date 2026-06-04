import { WebSocketServer, WebSocket } from 'ws';

interface Player {
  ws: WebSocket;
  id: string;
  ready: boolean;
}

interface Room {
  code: string;
  players: Map<string, Player>;
  seed: number;
  tier: number;
  round: number;
  maxRounds: number;
  scores: Map<string, number>;
  roundActive: boolean;
}

const rooms = new Map<string, Room>();
const playerRooms = new Map<WebSocket, string>();

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? genCode() : code;
}

function genId(): string {
  return 'p_' + Math.random().toString(36).slice(2, 8);
}

function broadcast(room: Room, msg: object, exclude?: string) {
  const data = JSON.stringify(msg);
  room.players.forEach((player) => {
    if (player.id !== exclude && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  });
}

function send(ws: WebSocket, msg: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function startRound(room: Room) {
  room.round++;
  room.seed = Math.floor(Math.random() * 999999);
  room.tier = Math.min(1 + Math.floor(room.round / 2), 5);
  room.roundActive = true;

  broadcast(room, {
    type: 'round-start',
    round: room.round,
    seed: room.seed,
    tier: room.tier,
  });
}

function cleanupRoom(code: string) {
  const room = rooms.get(code);
  if (!room) return;
  room.players.forEach((p) => playerRooms.delete(p.ws));
  rooms.delete(code);
}

const PORT = parseInt(process.env.PORT || '8080');
const wss = new WebSocketServer({ port: PORT });
console.log(`Fraction Kitchen relay server on port ${PORT}`);

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'create': {
        const code = genCode();
        const playerId = genId();
        const room: Room = {
          code,
          players: new Map(),
          seed: 0,
          tier: 1,
          round: 0,
          maxRounds: 5,
          scores: new Map(),
          roundActive: false,
        };
        room.players.set(playerId, { ws, id: playerId, ready: false });
        room.scores.set(playerId, 0);
        rooms.set(code, room);
        playerRooms.set(ws, code);
        send(ws, { type: 'room-created', roomCode: code, playerId });
        break;
      }

      case 'join': {
        const code = String(msg.roomCode).toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          send(ws, { type: 'error', message: 'Room not found' });
          return;
        }
        if (room.players.size >= 2) {
          send(ws, { type: 'error', message: 'Room is full' });
          return;
        }
        const playerId = genId();
        room.players.set(playerId, { ws, id: playerId, ready: false });
        room.scores.set(playerId, 0);
        playerRooms.set(ws, code);

        send(ws, { type: 'joined', roomCode: code, playerId });

        const otherPlayer = [...room.players.values()].find((p) => p.id !== playerId);
        if (otherPlayer) {
          send(otherPlayer.ws, { type: 'opponent-joined', opponentId: playerId });
        }

        // Auto-start when 2 players
        if (room.players.size === 2) {
          broadcast(room, { type: 'match-ready', players: [...room.players.keys()] });
          setTimeout(() => startRound(room), 3000);
        }
        break;
      }

      case 'pour': {
        const roomCode = playerRooms.get(ws);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room) return;
        const player = [...room.players.values()].find((p) => p.ws === ws);
        if (!player) return;

        broadcast(room, {
          type: 'opponent-pour',
          playerId: player.id,
          ingredientId: msg.ingredientId,
          denominator: msg.denominator,
        }, player.id);
        break;
      }

      case 'serve': {
        const roomCode = playerRooms.get(ws);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || !room.roundActive) return;
        const player = [...room.players.values()].find((p) => p.ws === ws);
        if (!player) return;

        const success = msg.success as boolean;
        if (success) {
          room.roundActive = false;
          const current = room.scores.get(player.id) || 0;
          room.scores.set(player.id, current + 1);

          broadcast(room, {
            type: 'round-result',
            winnerId: player.id,
            round: room.round,
            scores: Object.fromEntries(room.scores),
          });

          if (room.round >= room.maxRounds) {
            const [p1, p2] = [...room.scores.entries()];
            const winner = p1[1] > p2[1] ? p1[0] : p2[1] > p1[1] ? p2[0] : 'tie';
            broadcast(room, {
              type: 'match-over',
              winner,
              scores: Object.fromEntries(room.scores),
            });
            setTimeout(() => cleanupRoom(roomCode), 5000);
          } else {
            setTimeout(() => startRound(room), 3000);
          }
        } else {
          broadcast(room, {
            type: 'opponent-serve-fail',
            playerId: player.id,
          }, player.id);
        }
        break;
      }

      case 'dump': {
        const roomCode = playerRooms.get(ws);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room) return;
        const player = [...room.players.values()].find((p) => p.ws === ws);
        if (!player) return;

        broadcast(room, {
          type: 'opponent-dump',
          playerId: player.id,
        }, player.id);
        break;
      }
    }
  });

  ws.on('close', () => {
    const roomCode = playerRooms.get(ws);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        const player = [...room.players.values()].find((p) => p.ws === ws);
        if (player) {
          room.players.delete(player.id);
          broadcast(room, { type: 'opponent-disconnected', playerId: player.id });
        }
        if (room.players.size === 0) {
          cleanupRoom(roomCode);
        }
      }
      playerRooms.delete(ws);
    }
  });
});

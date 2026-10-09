import {
  addPlayer,
  applyAction,
  createLobbyState,
  EngineError,
  toClientState,
  type ClientGameState,
  type GameState,
} from '@sail/shared';
import { randomBytes } from 'node:crypto';
import type { RoomRecord, RoomStore } from './roomStore.js';

function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

function generatePlayerId(): string {
  return randomBytes(8).toString('hex');
}

export class RoomManager {
  constructor(private store: RoomStore) {}

  createRoom(displayName: string, socketId: string): {
    roomCode: string;
    playerId: string;
    state: ClientGameState;
  } {
    let roomCode = generateRoomCode();
    while (this.store.get(roomCode)) {
      roomCode = generateRoomCode();
    }
    const playerId = generatePlayerId();
    const seed = Date.now() % 1_000_000_000;
    let game = createLobbyState(roomCode, seed);
    game = addPlayer(game, {
      playerId,
      displayName: displayName.trim().slice(0, 24) || 'Pirate',
      connected: true,
      seat: 0,
    });
    const room: RoomRecord = {
      roomCode,
      game,
      createdAt: Date.now(),
      sockets: new Map([[playerId, socketId]]),
    };
    this.store.set(room);
    return {
      roomCode,
      playerId,
      state: toClientState(game, playerId),
    };
  }

  joinRoom(
    roomCode: string,
    displayName: string,
    socketId: string,
    existingPlayerId?: string,
  ): { roomCode: string; playerId: string; state: ClientGameState; game: GameState } {
    const room = this.store.get(roomCode);
    if (!room) {
      throw new EngineError('INVALID_ROOM', 'Room not found');
    }

    if (existingPlayerId) {
      const seat = room.game.players.find((p) => p.playerId === existingPlayerId);
      if (seat) {
        room.game = applyAction(room.game, {
          type: 'SET_CONNECTED',
          playerId: existingPlayerId,
          connected: true,
        });
        room.sockets.set(existingPlayerId, socketId);
        this.store.set(room);
        return {
          roomCode: room.roomCode,
          playerId: existingPlayerId,
          state: toClientState(room.game, existingPlayerId),
          game: room.game,
        };
      }
    }

    if (room.game.players.length >= 2) {
      throw new EngineError('ROOM_FULL', 'Room is full');
    }
    if (room.game.phase !== 'LOBBY' && room.game.phase !== 'SETUP') {
      throw new EngineError('GAME_ALREADY_STARTED', 'Game already started');
    }

    const playerId = generatePlayerId();
    room.game = addPlayer(room.game, {
      playerId,
      displayName: displayName.trim().slice(0, 24) || 'Pirate',
      connected: true,
      seat: 1,
    });
    room.sockets.set(playerId, socketId);
    this.store.set(room);
    return {
      roomCode: room.roomCode,
      playerId,
      state: toClientState(room.game, playerId),
      game: room.game,
    };
  }

  reconnect(
    roomCode: string,
    playerId: string,
    socketId: string,
  ): { state: ClientGameState; game: GameState } {
    const room = this.store.get(roomCode);
    if (!room) throw new EngineError('INVALID_ROOM', 'Room not found');
    const player = room.game.players.find((p) => p.playerId === playerId);
    if (!player) throw new EngineError('INVALID_ROOM', 'Player not in room');
    room.game = applyAction(room.game, {
      type: 'SET_CONNECTED',
      playerId,
      connected: true,
    });
    room.sockets.set(playerId, socketId);
    this.store.set(room);
    return {
      state: toClientState(room.game, playerId),
      game: room.game,
    };
  }

  disconnect(socketId: string): { room: RoomRecord; playerId: string } | null {
    for (const room of [...this.allRooms()]) {
      for (const [playerId, sid] of room.sockets.entries()) {
        if (sid === socketId) {
          room.sockets.delete(playerId);
          room.game = applyAction(room.game, {
            type: 'SET_CONNECTED',
            playerId,
            connected: false,
          });
          this.store.set(room);
          return { room, playerId };
        }
      }
    }
    return null;
  }

  withRoom(
    roomCode: string,
    playerId: string,
    mutate: (game: GameState) => GameState,
  ): { room: RoomRecord; states: Map<string, ClientGameState> } {
    const room = this.store.get(roomCode);
    if (!room) throw new EngineError('INVALID_ROOM', 'Room not found');
    if (!room.game.players.some((p) => p.playerId === playerId)) {
      throw new EngineError('UNKNOWN', 'Not in room');
    }
    room.game = mutate(room.game);
    this.store.set(room);
    const states = new Map<string, ClientGameState>();
    for (const p of room.game.players) {
      states.set(p.playerId, toClientState(room.game, p.playerId));
    }
    return { room, states };
  }

  getProjected(roomCode: string, playerId: string): ClientGameState {
    const room = this.store.get(roomCode);
    if (!room) throw new EngineError('INVALID_ROOM', 'Room not found');
    return toClientState(room.game, playerId);
  }

  getRoom(roomCode: string): RoomRecord | undefined {
    return this.store.get(roomCode);
  }

  private allRooms(): RoomRecord[] {
    return this.store.list();
  }

  leave(roomCode: string, playerId: string): void {
    const room = this.store.get(roomCode);
    if (!room) return;
    room.sockets.delete(playerId);
    room.game = {
      ...room.game,
      players: room.game.players.filter((p) => p.playerId !== playerId),
      phase:
        room.game.phase === 'PLAYING' ||
        room.game.phase === 'EXCHANGE' ||
        room.game.phase === 'ROUND_END'
          ? room.game.phase
          : 'LOBBY',
    };
    if (room.game.players.length === 0) {
      this.store.delete(roomCode);
    } else {
      this.store.set(room);
    }
  }
}

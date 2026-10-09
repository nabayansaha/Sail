import type { GameState } from '@sail/shared';

/**
 * Room persistence interface — in-memory for v1; Redis can implement later.
 */
export interface RoomRecord {
  roomCode: string;
  game: GameState;
  createdAt: number;
  /** socketId by playerId */
  sockets: Map<string, string>;
}

export interface RoomStore {
  get(roomCode: string): RoomRecord | undefined;
  set(room: RoomRecord): void;
  delete(roomCode: string): void;
  findByPlayerId(playerId: string): RoomRecord | undefined;
  list(): RoomRecord[];
}

export class InMemoryRoomStore implements RoomStore {
  private rooms = new Map<string, RoomRecord>();

  get(roomCode: string): RoomRecord | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  set(room: RoomRecord): void {
    this.rooms.set(room.roomCode.toUpperCase(), room);
  }

  delete(roomCode: string): void {
    this.rooms.delete(roomCode.toUpperCase());
  }

  findByPlayerId(playerId: string): RoomRecord | undefined {
    for (const room of this.rooms.values()) {
      if (room.game.players.some((p) => p.playerId === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  list(): RoomRecord[] {
    return [...this.rooms.values()];
  }
}

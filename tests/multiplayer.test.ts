import { describe, expect, it } from 'vitest';
import { applyAction, EngineError, toClientState } from '@sail/shared';
import { RoomManager } from '../server/src/roomManager';
import { InMemoryRoomStore } from '../server/src/roomStore';

describe('room manager', () => {
  it('creates and joins a room', () => {
    const mgr = new RoomManager(new InMemoryRoomStore());
    const created = mgr.createRoom('Alice', 'sock1');
    expect(created.roomCode).toHaveLength(6);
    const joined = mgr.joinRoom(created.roomCode, 'Bob', 'sock2');
    expect(joined.playerId).not.toBe(created.playerId);
    expect(joined.game.players).toHaveLength(2);
  });

  it('rejects a third player', () => {
    const mgr = new RoomManager(new InMemoryRoomStore());
    const created = mgr.createRoom('Alice', 'sock1');
    mgr.joinRoom(created.roomCode, 'Bob', 'sock2');
    expect(() => mgr.joinRoom(created.roomCode, 'Carol', 'sock3')).toThrow(EngineError);
    try {
      mgr.joinRoom(created.roomCode, 'Carol', 'sock3');
    } catch (e) {
      expect((e as EngineError).code).toBe('ROOM_FULL');
    }
  });

  it('isolates private hands in projections', () => {
    const mgr = new RoomManager(new InMemoryRoomStore());
    const a = mgr.createRoom('Alice', 'sock1');
    const b = mgr.joinRoom(a.roomCode, 'Bob', 'sock2');
    mgr.withRoom(a.roomCode, a.playerId, (game) => {
      let g = applyAction(game, {
        type: 'CHOOSE_PIRATE',
        playerId: a.playerId,
        pirateId: 'anne-bonny',
      });
      g = applyAction(g, {
        type: 'CHOOSE_PIRATE',
        playerId: b.playerId,
        pirateId: 'blackbeard',
      });
      g = applyAction(g, { type: 'START_GAME' });
      return g;
    });
    const room = mgr.getRoom(a.roomCode)!;
    const viewA = toClientState(room.game, a.playerId);
    const viewB = toClientState(room.game, b.playerId);
    const handAIds = new Set(viewA.you.hand.map((c) => c.id));
    const handBIds = new Set(viewB.you.hand.map((c) => c.id));
    for (const id of handAIds) {
      expect(handBIds.has(id)).toBe(false);
    }
    expect(JSON.stringify(viewA)).not.toContain(viewB.you.hand[0]!.id);
  });

  it('rejects invalid actions', () => {
    const mgr = new RoomManager(new InMemoryRoomStore());
    const a = mgr.createRoom('Alice', 'sock1');
    expect(() =>
      mgr.withRoom(a.roomCode, a.playerId, (game) =>
        applyAction(game, { type: 'START_GAME' }),
      ),
    ).toThrow();
  });

  it('supports reconnect', () => {
    const mgr = new RoomManager(new InMemoryRoomStore());
    const a = mgr.createRoom('Alice', 'sock1');
    mgr.disconnect('sock1');
    const room = mgr.getRoom(a.roomCode)!;
    expect(room.game.players[0]!.connected).toBe(false);
    const re = mgr.reconnect(a.roomCode, a.playerId, 'sock1b');
    expect(re.state.players.find((p) => p.playerId === a.playerId)?.connected).toBe(
      true,
    );
  });
});

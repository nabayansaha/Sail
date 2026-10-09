import {
  applyAction,
  availablePirates,
  EngineError,
  type ClientToServerEvents,
  type ErrorCode,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '@sail/shared';
import type { Server, Socket } from 'socket.io';
import type { RoomManager } from './roomManager.js';
import {
  choosePirateSchema,
  chooseScenarioSchema,
  createRoomSchema,
  exchangeCardSchema,
  joinRoomSchema,
  playCardSchema,
  reconnectSchema,
} from './validation.js';

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

function errorCode(err: unknown): ErrorCode {
  if (err instanceof EngineError) return err.code;
  return 'UNKNOWN';
}

function emitError(socket: AppSocket, err: unknown): void {
  const code = errorCode(err);
  const message = err instanceof Error ? err.message : 'Unknown error';
  socket.emit('error', { code, message });
  socket.emit('invalid_action', { code, message });
}

function broadcastStates(
  io: AppServer,
  roomManager: RoomManager,
  roomCode: string,
): void {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  for (const player of room.game.players) {
    const sid = room.sockets.get(player.playerId);
    if (!sid) continue;
    const state = roomManager.getProjected(roomCode, player.playerId);
    io.to(sid).emit('game_state', state);
    if (state.phase === 'WON' || state.phase === 'LOST') {
      io.to(sid).emit('game_over', {
        result: state.phase,
        reason: state.lossReason,
      });
    }
  }
}

export function registerSocketHandlers(io: AppServer, roomManager: RoomManager): void {
  io.on('connection', (socket: AppSocket) => {
    socket.emit('pirates_available', { pirates: availablePirates() });

    socket.on('create_room', (payload, ack) => {
      try {
        const data = createRoomSchema.parse(payload);
        const result = roomManager.createRoom(data.displayName, socket.id);
        socket.data.playerId = result.playerId;
        socket.data.roomCode = result.roomCode;
        socket.data.displayName = data.displayName;
        void socket.join(result.roomCode);
        socket.emit('room_created', {
          roomCode: result.roomCode,
          playerId: result.playerId,
        });
        socket.emit('game_state', result.state);
        ack?.({ ok: true, roomCode: result.roomCode, playerId: result.playerId });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('join_room', (payload, ack) => {
      try {
        const data = joinRoomSchema.parse(payload);
        const result = roomManager.joinRoom(
          data.roomCode,
          data.displayName,
          socket.id,
          data.playerId,
        );
        socket.data.playerId = result.playerId;
        socket.data.roomCode = result.roomCode;
        socket.data.displayName = data.displayName;
        void socket.join(result.roomCode);
        socket.emit('room_joined', {
          roomCode: result.roomCode,
          playerId: result.playerId,
        });
        const joiner = result.game.players.find((p) => p.playerId === result.playerId)!;
        socket.to(result.roomCode).emit('player_joined', {
          playerId: joiner.playerId,
          displayName: joiner.displayName,
          seat: joiner.seat,
        });
        broadcastStates(io, roomManager, result.roomCode);
        ack?.({ ok: true, roomCode: result.roomCode, playerId: result.playerId });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('reconnect', (payload, ack) => {
      try {
        const data = reconnectSchema.parse(payload);
        const result = roomManager.reconnect(data.roomCode, data.playerId, socket.id);
        socket.data.playerId = data.playerId;
        socket.data.roomCode = data.roomCode;
        void socket.join(data.roomCode);
        socket.emit('room_joined', {
          roomCode: data.roomCode,
          playerId: data.playerId,
        });
        broadcastStates(io, roomManager, data.roomCode);
        ack?.({ ok: true, roomCode: data.roomCode, playerId: data.playerId });
        void result;
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('choose_pirate', (payload, ack) => {
      try {
        const data = choosePirateSchema.parse(payload);
        const { roomCode, playerId } = requireSeat(socket);
        roomManager.withRoom(roomCode, playerId, (game) =>
          applyAction(game, {
            type: 'CHOOSE_PIRATE',
            playerId,
            pirateId: data.pirateId,
          }),
        );
        broadcastStates(io, roomManager, roomCode);
        ack?.({ ok: true });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('choose_scenario', (payload, ack) => {
      try {
        const data = chooseScenarioSchema.parse(payload);
        const { roomCode, playerId } = requireSeat(socket);
        roomManager.withRoom(roomCode, playerId, (game) =>
          applyAction(game, {
            type: 'CHOOSE_SCENARIO',
            playerId,
            scenarioId: data.scenarioId,
          }),
        );
        broadcastStates(io, roomManager, roomCode);
        ack?.({ ok: true });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('start_game', (_payload, ack) => {
      try {
        const { roomCode, playerId } = requireSeat(socket);
        roomManager.withRoom(roomCode, playerId, (game) =>
          applyAction(game, { type: 'START_GAME' }),
        );
        const room = roomManager.getRoom(roomCode)!;
        io.to(roomCode).emit('game_started', { scenarioId: room.game.scenarioId });
        broadcastStates(io, roomManager, roomCode);
        ack?.({ ok: true });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('exchange_card', (payload, ack) => {
      try {
        const data = exchangeCardSchema.parse(payload);
        const { roomCode, playerId } = requireSeat(socket);
        roomManager.withRoom(roomCode, playerId, (game) =>
          applyAction(game, {
            type: 'EXCHANGE_CARD',
            playerId,
            cardId: data.cardId,
          }),
        );
        broadcastStates(io, roomManager, roomCode);
        ack?.({ ok: true });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('play_card', (payload, ack) => {
      try {
        const data = playCardSchema.parse(payload);
        const { roomCode, playerId } = requireSeat(socket);
        roomManager.withRoom(roomCode, playerId, (game) =>
          applyAction(game, {
            type: 'PLAY_CARD',
            playerId,
            cardId: data.cardId,
            chooseStraight: data.chooseStraight,
            ignoreKrakenDamage: data.ignoreKrakenDamage,
          }),
        );
        broadcastStates(io, roomManager, roomCode);
        ack?.({ ok: true });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('restart_game', (_payload, ack) => {
      try {
        const { roomCode, playerId } = requireSeat(socket);
        roomManager.withRoom(roomCode, playerId, (game) =>
          applyAction(game, { type: 'RESTART' }),
        );
        broadcastStates(io, roomManager, roomCode);
        ack?.({ ok: true });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('leave_room', (_payload, ack) => {
      try {
        const { roomCode, playerId } = requireSeat(socket);
        roomManager.leave(roomCode, playerId);
        socket.to(roomCode).emit('player_left', { playerId });
        void socket.leave(roomCode);
        socket.data.roomCode = undefined;
        socket.data.playerId = undefined;
        ack?.({ ok: true });
      } catch (err) {
        emitError(socket, err);
        ack?.({ ok: false, code: errorCode(err), message: String(err) });
      }
    });

    socket.on('disconnect', () => {
      const result = roomManager.disconnect(socket.id);
      if (result) {
        socket.to(result.room.roomCode).emit('player_left', {
          playerId: result.playerId,
        });
        broadcastStates(io, roomManager, result.room.roomCode);
      }
    });
  });
}

function requireSeat(socket: AppSocket): { roomCode: string; playerId: string } {
  const roomCode = socket.data.roomCode;
  const playerId = socket.data.playerId;
  if (!roomCode || !playerId) {
    throw new EngineError('UNKNOWN', 'Not in a room');
  }
  return { roomCode, playerId };
}

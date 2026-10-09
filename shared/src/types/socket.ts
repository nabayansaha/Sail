import type { ClientGameState, PirateDefinition } from './game.js';

export type ErrorCode =
  | 'INVALID_ROOM'
  | 'ROOM_FULL'
  | 'INVALID_CARD'
  | 'NOT_YOUR_TURN'
  | 'ILLEGAL_MOVE'
  | 'PLAYER_DISCONNECTED'
  | 'GAME_ALREADY_STARTED'
  | 'INVALID_PHASE'
  | 'INVALID_PAYLOAD'
  | 'NOT_IN_ROOM'
  | 'PIRATE_TAKEN'
  | 'NOT_READY'
  | 'UNKNOWN';

export interface ClientToServerEvents {
  create_room: (payload: { displayName: string }, ack?: (res: AckResponse) => void) => void;
  join_room: (
    payload: { roomCode: string; displayName: string; playerId?: string },
    ack?: (res: AckResponse) => void,
  ) => void;
  choose_pirate: (payload: { pirateId: string }, ack?: (res: AckResponse) => void) => void;
  choose_scenario: (payload: { scenarioId: string }, ack?: (res: AckResponse) => void) => void;
  start_game: (payload?: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  exchange_card: (payload: { cardId: string }, ack?: (res: AckResponse) => void) => void;
  play_card: (
    payload: { cardId: string; chooseStraight?: boolean; ignoreKrakenDamage?: boolean },
    ack?: (res: AckResponse) => void,
  ) => void;
  restart_game: (payload?: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  leave_room: (payload?: Record<string, never>, ack?: (res: AckResponse) => void) => void;
  reconnect: (
    payload: { roomCode: string; playerId: string },
    ack?: (res: AckResponse) => void,
  ) => void;
}

export interface ServerToClientEvents {
  room_created: (payload: { roomCode: string; playerId: string }) => void;
  room_joined: (payload: { roomCode: string; playerId: string }) => void;
  player_joined: (payload: {
    playerId: string;
    displayName: string;
    seat: 0 | 1;
  }) => void;
  player_left: (payload: { playerId: string }) => void;
  game_started: (payload: { scenarioId: string }) => void;
  game_state: (payload: ClientGameState) => void;
  invalid_action: (payload: { code: ErrorCode; message: string }) => void;
  game_over: (payload: { result: 'WON' | 'LOST'; reason: string | null }) => void;
  error: (payload: { code: ErrorCode; message: string }) => void;
  pirates_available: (payload: { pirates: PirateDefinition[] }) => void;
}

export interface AckResponse {
  ok: boolean;
  code?: ErrorCode;
  message?: string;
  roomCode?: string;
  playerId?: string;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId?: string;
  roomCode?: string;
  displayName?: string;
}

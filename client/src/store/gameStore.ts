import type {
  AckResponse,
  ClientGameState,
  ErrorCode,
  PirateDefinition,
} from '@sail/shared';
import { create } from 'zustand';
import { getSocket } from '../lib/socket';

export type Screen =
  | 'landing'
  | 'create'
  | 'join'
  | 'lobby'
  | 'game'
  | 'gameover';

interface GameStore {
  screen: Screen;
  roomCode: string | null;
  playerId: string | null;
  displayName: string;
  state: ClientGameState | null;
  pirates: PirateDefinition[];
  error: string | null;
  lastErrorCode: ErrorCode | null;
  connecting: boolean;
  setScreen: (screen: Screen) => void;
  setDisplayName: (name: string) => void;
  clearError: () => void;
  bindSocket: () => void;
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
  choosePirate: (pirateId: string) => void;
  chooseScenario: (scenarioId: string) => void;
  startGame: () => void;
  exchangeCard: (cardId: string) => void;
  playCard: (
    cardId: string,
    opts?: { chooseStraight?: boolean; ignoreKrakenDamage?: boolean },
  ) => void;
  restartGame: () => void;
  leaveRoom: () => void;
  tryReconnect: () => void;
}

const STORAGE_KEY = 'sail-session';

function saveSession(roomCode: string, playerId: string, displayName: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ roomCode, playerId, displayName }),
  );
}

function loadSession(): {
  roomCode: string;
  playerId: string;
  displayName: string;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      roomCode: string;
      playerId: string;
      displayName: string;
    };
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'landing',
  roomCode: null,
  playerId: null,
  displayName: '',
  state: null,
  pirates: [],
  error: null,
  lastErrorCode: null,
  connecting: false,

  setScreen: (screen) => set({ screen }),
  setDisplayName: (displayName) => set({ displayName }),
  clearError: () => set({ error: null, lastErrorCode: null }),

  bindSocket: () => {
    const socket = getSocket();
    socket.on('pirates_available', ({ pirates }) => set({ pirates }));
    socket.on('room_created', ({ roomCode, playerId }) => {
      saveSession(roomCode, playerId, get().displayName);
      set({ roomCode, playerId, screen: 'lobby' });
    });
    socket.on('room_joined', ({ roomCode, playerId }) => {
      saveSession(roomCode, playerId, get().displayName);
      set({ roomCode, playerId, screen: 'lobby' });
    });
    socket.on('game_state', (state) => {
      const screen: Screen =
        state.phase === 'WON' || state.phase === 'LOST'
          ? 'gameover'
          : state.phase === 'LOBBY' || state.phase === 'SETUP'
            ? 'lobby'
            : 'game';
      set({ state, screen, error: null });
    });
    socket.on('game_over', () => set({ screen: 'gameover' }));
    socket.on('invalid_action', ({ code, message }) =>
      set({ error: message, lastErrorCode: code }),
    );
    socket.on('error', ({ code, message }) =>
      set({ error: message, lastErrorCode: code }),
    );
    socket.on('connect', () => {
      get().tryReconnect();
    });
  },

  createRoom: () => {
    const name = get().displayName.trim() || 'Pirate';
    set({ displayName: name, connecting: true, error: null });
    getSocket().emit('create_room', { displayName: name }, (res: AckResponse) => {
      set({ connecting: false });
      if (!res.ok) set({ error: res.message ?? 'Failed to create room' });
    });
  },

  joinRoom: (roomCode) => {
    const name = get().displayName.trim() || 'Pirate';
    set({ displayName: name, connecting: true, error: null });
    getSocket().emit(
      'join_room',
      { roomCode: roomCode.trim().toUpperCase(), displayName: name },
      (res: AckResponse) => {
        set({ connecting: false });
        if (!res.ok) set({ error: res.message ?? 'Failed to join room' });
      },
    );
  },

  choosePirate: (pirateId) => {
    getSocket().emit('choose_pirate', { pirateId });
  },

  chooseScenario: (scenarioId) => {
    getSocket().emit('choose_scenario', { scenarioId });
  },

  startGame: () => {
    getSocket().emit('start_game', {});
  },

  exchangeCard: (cardId) => {
    getSocket().emit('exchange_card', { cardId });
  },

  playCard: (cardId, opts) => {
    getSocket().emit('play_card', { cardId, ...opts });
  },

  restartGame: () => {
    getSocket().emit('restart_game', {});
  },

  leaveRoom: () => {
    getSocket().emit('leave_room', {});
    clearSession();
    set({
      screen: 'landing',
      roomCode: null,
      playerId: null,
      state: null,
    });
  },

  tryReconnect: () => {
    const session = loadSession();
    if (!session) return;
    set({
      displayName: session.displayName,
      roomCode: session.roomCode,
      playerId: session.playerId,
    });
    getSocket().emit(
      'reconnect',
      { roomCode: session.roomCode, playerId: session.playerId },
      (res: AckResponse) => {
        if (!res.ok) {
          clearSession();
          set({ roomCode: null, playerId: null });
        }
      },
    );
  },
}));

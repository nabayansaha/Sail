import type {
  ClientGameState,
  GameState,
  PlayerPublic,
} from '../types/game.js';
import { getPirate, listPirates } from './pirates.js';
import { getLegalCardIds } from './rules.js';
import { getScenario, listScenarios } from './scenarios.js';

export function emptyAbilityUsage(): GameState['abilityUsage'][string] {
  return {
    ignoredKrakenHelmDamage: false,
    choseStraightOnHelm: false,
    damageMitigated: 0,
  };
}

export function createLobbyState(roomCode: string, seed: number): GameState {
  return {
    phase: 'LOBBY',
    roomCode,
    scenarioId: 'scenario-1',
    players: [],
    currentRound: 0,
    currentTurnPlayerId: null,
    hands: {},
    exchangeSelections: {},
    exchangePeekIds: {},
    playerDeck: [],
    discardPile: [],
    trick: { leadingPlayerId: null, playedCards: [], winnerId: null, abilityOpts: {} },
    ship: { position: { col: 3, row: 1 }, facing: 'forward' },
    kraken: {
      trackerIndex: 0,
      damageValue: 0,
      deck: [],
      hasKrakenCard: true,
    },
    board: [],
    storms: [],
    start: { col: 3, row: 1 },
    end: { col: 3, row: 17 },
    boardCols: 7,
    boardRows: 17,
    actionLog: [],
    lossReason: null,
    abilityUsage: {},
    seed,
  };
}

export function addPlayer(
  state: GameState,
  player: Omit<PlayerPublic, 'tricksWon' | 'handCount' | 'pirateId'> & {
    pirateId?: string | null;
  },
): GameState {
  if (state.players.length >= 2) {
    throw new Error('ROOM_FULL');
  }
  const seat = state.players.length as 0 | 1;
  const next: PlayerPublic = {
    playerId: player.playerId,
    displayName: player.displayName,
    pirateId: player.pirateId ?? null,
    connected: player.connected,
    seat,
    tricksWon: 0,
    handCount: 0,
  };
  return {
    ...state,
    players: [...state.players, next],
    hands: { ...state.hands, [player.playerId]: [] },
    exchangeSelections: { ...state.exchangeSelections, [player.playerId]: null },
    exchangePeekIds: { ...state.exchangePeekIds, [player.playerId]: [] },
    abilityUsage: { ...state.abilityUsage, [player.playerId]: emptyAbilityUsage() },
  };
}

export function syncHandCounts(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      handCount: state.hands[p.playerId]?.length ?? 0,
    })),
  };
}

export function toClientState(state: GameState, viewerId: string): ClientGameState {
  const you = state.players.find((p) => p.playerId === viewerId);
  const opponent = state.players.find((p) => p.playerId !== viewerId);
  const scenario = getScenario(state.scenarioId);

  const youSel = state.exchangeSelections[viewerId];
  const oppSel = opponent
    ? state.exchangeSelections[opponent.playerId]
    : null;
  const countSel = (sel: string | null | undefined) =>
    sel ? sel.split(',').filter(Boolean).length : 0;

  return {
    phase: state.phase,
    roomCode: state.roomCode,
    scenarioId: state.scenarioId,
    scenarioName: scenario.name,
    players: state.players.map((p) => ({
      ...p,
    })),
    currentRound: state.currentRound,
    currentTurnPlayerId: state.currentTurnPlayerId,
    you: {
      playerId: viewerId,
      hand: [...(state.hands[viewerId] ?? [])],
      pirateId: you?.pirateId ?? null,
      exchangeSelected: Boolean(youSel),
      exchangeSelectedCount: countSel(youSel),
      peekedCardIds: [...(state.exchangePeekIds[viewerId] ?? [])],
    },
    opponent: {
      playerId: opponent?.playerId ?? null,
      handCount: opponent ? (state.hands[opponent.playerId]?.length ?? 0) : 0,
      pirateId: opponent?.pirateId ?? null,
      exchangeSelected: Boolean(oppSel),
      exchangeSelectedCount: countSel(oppSel),
    },
    discardPile: [...state.discardPile],
    playerDeckCount: state.playerDeck.length,
    trick: {
      leadingPlayerId: state.trick.leadingPlayerId,
      playedCards: state.trick.playedCards.map((tc) => ({
        playerId: tc.playerId,
        card: { ...tc.card },
      })),
      winnerId: state.trick.winnerId,
      abilityOpts: { ...state.trick.abilityOpts },
    },
    ship: {
      position: { ...state.ship.position },
      facing: state.ship.facing,
    },
    kraken: {
      trackerIndex: state.kraken.trackerIndex,
      damageValue: state.kraken.damageValue,
      deck: state.kraken.deck.map((c) => ({ ...c })),
      hasKrakenCard: state.kraken.hasKrakenCard,
      deckCount: state.kraken.deck.length,
    },
    board: state.board.map((c) => ({
      position: { ...c.position },
      type: c.type,
    })),
    storms: [...state.storms],
    start: { ...state.start },
    end: { ...state.end },
    boardCols: state.boardCols,
    boardRows: state.boardRows,
    actionLog: [...state.actionLog].slice(-20),
    lossReason: state.lossReason,
    legalCardIds: getLegalCardIds(state, viewerId),
    pirates: listPirates(),
    scenarios: listScenarios(),
  };
}

export function getPlayerPirate(state: GameState, playerId: string) {
  const p = state.players.find((x) => x.playerId === playerId);
  if (!p?.pirateId) return null;
  return getPirate(p.pirateId);
}

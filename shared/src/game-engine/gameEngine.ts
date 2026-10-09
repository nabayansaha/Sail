import type { Card, GameState, LossReason, Position } from '../types/game.js';
import { EngineAction, EngineError } from './actions.js';
import { symbolLabel } from './cards.js';
import { createInitialDecks, dealHands, isKrakenSentinel, reshapePlayerDeck } from './deck.js';
import { emptyAbilityUsage, getPlayerPirate, syncHandCounts } from './gameState.js';
import { getPirate, listPirates } from './pirates.js';
import { createSeededRng, type Rng } from './rng.js';
import {
  canPlayCard,
  cellTypeAt,
  determineTrickWinner,
  diagonalTarget,
  isOnBoard,
  isPastStorm,
  leadSeatForRound,
  resolvePairAction,
  straightTarget,
} from './rules.js';
import { buildBoard, getScenario, listScenarios, samePos } from './scenarios.js';

/** Kraken tracker: indices 0..5 with damage values; index 6 = Dead */
export const KRAKEN_TRACK = [
  { damage: 0 },
  { damage: 1 },
  { damage: 2 },
  { damage: 3 },
  { damage: 4 },
  { damage: 5 },
  { damage: 0, dead: true },
] as const;

export function applyAction(state: GameState, action: EngineAction): GameState {
  switch (action.type) {
    case 'CHOOSE_PIRATE':
      return choosePirate(state, action.playerId, action.pirateId);
    case 'CHOOSE_SCENARIO':
      return chooseScenario(state, action.scenarioId);
    case 'START_GAME':
      return startGame(state);
    case 'EXCHANGE_CARD':
      return exchangeCard(state, action.playerId, action.cardId);
    case 'PLAY_CARD':
      return playCard(state, action);
    case 'RESTART':
      return restartGame(state);
    case 'SET_CONNECTED':
      return setConnected(state, action.playerId, action.connected);
    default:
      throw new EngineError('UNKNOWN', 'Unknown action');
  }
}

function choosePirate(state: GameState, playerId: string, pirateId: string): GameState {
  if (state.phase !== 'LOBBY' && state.phase !== 'SETUP') {
    throw new EngineError('INVALID_PHASE', 'Cannot choose pirate now');
  }
  getPirate(pirateId);
  const taken = state.players.some(
    (p) => p.playerId !== playerId && p.pirateId === pirateId,
  );
  if (taken) throw new EngineError('PIRATE_TAKEN', 'Pirate already chosen');
  return {
    ...state,
    phase: state.phase === 'LOBBY' ? 'SETUP' : state.phase,
    players: state.players.map((p) =>
      p.playerId === playerId ? { ...p, pirateId } : p,
    ),
  };
}

function chooseScenario(state: GameState, scenarioId: string): GameState {
  if (state.phase !== 'LOBBY' && state.phase !== 'SETUP') {
    throw new EngineError('INVALID_PHASE', 'Cannot change scenario now');
  }
  getScenario(scenarioId);
  return {
    ...state,
    scenarioId,
    phase: state.phase === 'LOBBY' ? 'SETUP' : state.phase,
    actionLog: [...state.actionLog, `Scenario set: ${getScenario(scenarioId).name}`],
  };
}

function startGame(state: GameState): GameState {
  if (state.phase !== 'LOBBY' && state.phase !== 'SETUP') {
    throw new EngineError('GAME_ALREADY_STARTED', 'Game already started');
  }
  if (state.players.length !== 2) {
    throw new EngineError('NOT_READY', 'Need two players');
  }
  if (state.players.some((p) => !p.pirateId)) {
    throw new EngineError('NOT_READY', 'Both players must choose a pirate');
  }
  return beginRound(setupBoard(state), 1);
}

function setupBoard(state: GameState): GameState {
  const scenario = getScenario(state.scenarioId);
  const { krakenDeck, playerDeck } = createInitialDecks(state.seed);
  return {
    ...state,
    board: buildBoard(scenario),
    boardCols: scenario.cols,
    boardRows: scenario.rows,
    storms: [...scenario.storms],
    start: { ...scenario.start },
    end: { ...scenario.end },
    ship: { position: { ...scenario.start }, facing: 'forward' },
    kraken: {
      trackerIndex: 0,
      damageValue: KRAKEN_TRACK[0].damage,
      deck: krakenDeck,
      hasKrakenCard: true,
    },
    playerDeck,
    discardPile: [],
    actionLog: ['Game started — set sail!'],
    lossReason: null,
  };
}

function beginRound(state: GameState, round: number): GameState {
  const rng = createSeededRng(state.seed + round * 997);
  const playerIds = state.players.map((p) => p.playerId) as [string, string];

  let playerDeck = state.playerDeck;
  if (round > 1) {
    playerDeck = reshapePlayerDeck(
      state.playerDeck,
      state.discardPile,
      state.hands,
      rng,
    );
  }

  const { hands, remaining } = dealHands(playerDeck, playerIds);

  const abilityUsage: GameState['abilityUsage'] = {};
  for (const p of state.players) {
    abilityUsage[p.playerId] = emptyAbilityUsage();
  }

  return syncHandCounts({
    ...state,
    phase: 'EXCHANGE',
    currentRound: round,
    playerDeck: remaining,
    discardPile: [],
    hands,
    exchangeSelections: Object.fromEntries(playerIds.map((id) => [id, null])),
    exchangePeekIds: Object.fromEntries(playerIds.map((id) => [id, []])),
    players: state.players.map((p) => ({ ...p, tricksWon: 0 })),
    trick: { leadingPlayerId: null, playedCards: [], winnerId: null, abilityOpts: {} },
    currentTurnPlayerId: null,
    abilityUsage,
    actionLog: [
      ...state.actionLog,
      `Round ${round} begins — exchange one card (no communication).`,
    ],
  });
}

function exchangeCard(state: GameState, playerId: string, cardId: string): GameState {
  if (state.phase !== 'EXCHANGE') {
    throw new EngineError('INVALID_PHASE', 'Not in exchange phase');
  }
  const hand = state.hands[playerId];
  if (!hand?.some((c) => c.id === cardId)) {
    throw new EngineError('INVALID_CARD', 'Card not in hand');
  }
  const pirate = getPlayerPirate(state, playerId);
  const needed = pirate?.exchangeCount ?? 1;

  // For exchangeCount > 1 we still use a single selection slot storing comma-separated ids
  // Simplified: Calico Jack exchanges 2 by selecting twice via accumulating ids.
  const existing = state.exchangeSelections[playerId];
  let nextSelection = cardId;
  if (needed > 1 && existing) {
    const ids = existing.split(',').filter(Boolean);
    if (ids.includes(cardId)) {
      throw new EngineError('ILLEGAL_MOVE', 'Already selected that card');
    }
    if (ids.length >= needed) {
      throw new EngineError('ILLEGAL_MOVE', 'Already selected enough cards');
    }
    nextSelection = [...ids, cardId].join(',');
  } else if (existing && needed === 1) {
    throw new EngineError('ILLEGAL_MOVE', 'Already selected a card');
  }

  let next: GameState = {
    ...state,
    exchangeSelections: { ...state.exchangeSelections, [playerId]: nextSelection },
  };

  const ready = next.players.every((p) => {
    const sel = next.exchangeSelections[p.playerId];
    if (!sel) return false;
    const count = sel.split(',').filter(Boolean).length;
    const pPirate = getPlayerPirate(next, p.playerId);
    return count >= (pPirate?.exchangeCount ?? 1);
  });

  if (ready) {
    next = resolveExchange(next);
  }
  return next;
}

function resolveExchange(state: GameState): GameState {
  const [a, b] = state.players;
  const aIds = (state.exchangeSelections[a.playerId] ?? '').split(',').filter(Boolean);
  const bIds = (state.exchangeSelections[b.playerId] ?? '').split(',').filter(Boolean);

  let handA = [...(state.hands[a.playerId] ?? [])];
  let handB = [...(state.hands[b.playerId] ?? [])];

  const takeCards = (hand: Card[], ids: string[]): { kept: Card[]; given: Card[] } => {
    const given: Card[] = [];
    const kept: Card[] = [];
    for (const c of hand) {
      if (ids.includes(c.id) && given.length < ids.length && !given.find((g) => g.id === c.id)) {
        given.push(c);
      } else {
        kept.push(c);
      }
    }
    if (given.length !== ids.length) {
      throw new EngineError('INVALID_CARD', 'Exchange selection invalid');
    }
    return { kept, given };
  };

  const fromA = takeCards(handA, aIds);
  const fromB = takeCards(handB, bIds);
  handA = [...fromA.kept, ...fromB.given];
  handB = [...fromB.kept, ...fromA.given];

  const pirateA = getPlayerPirate(state, a.playerId);
  const pirateB = getPlayerPirate(state, b.playerId);
  const exchangePeekIds: Record<string, string[]> = {
    [a.playerId]: pirateA?.peekExchange
      ? fromB.given.map((c) => c.id)
      : [],
    [b.playerId]: pirateB?.peekExchange
      ? fromA.given.map((c) => c.id)
      : [],
  };

  const leadSeat = leadSeatForRound(state.currentRound);
  const leader = state.players.find((p) => p.seat === leadSeat)!;

  return syncHandCounts({
    ...state,
    phase: 'PLAYING',
    hands: {
      [a.playerId]: handA,
      [b.playerId]: handB,
    },
    exchangeSelections: {
      [a.playerId]: null,
      [b.playerId]: null,
    },
    exchangePeekIds,
    trick: {
      leadingPlayerId: leader.playerId,
      playedCards: [],
      winnerId: null,
      abilityOpts: {},
    },
    currentTurnPlayerId: leader.playerId,
    actionLog: [
      ...state.actionLog,
      'Cards exchanged. Play begins — silence!',
      ...(pirateA?.peekExchange
        ? [`${a.displayName} peeks at the exchanged card.`]
        : []),
      ...(pirateB?.peekExchange
        ? [`${b.displayName} peeks at the exchanged card.`]
        : []),
    ],
  });
}

function playCard(
  state: GameState,
  action: {
    playerId: string;
    cardId: string;
    chooseStraight?: boolean;
    ignoreKrakenDamage?: boolean;
  },
): GameState {
  if (state.phase !== 'PLAYING') {
    throw new EngineError('INVALID_PHASE', 'Not playing');
  }
  if (state.currentTurnPlayerId !== action.playerId) {
    throw new EngineError('NOT_YOUR_TURN', 'Not your turn');
  }
  if (!canPlayCard(state, action.playerId, action.cardId)) {
    throw new EngineError('ILLEGAL_MOVE', 'Illegal card play');
  }

  const hand = state.hands[action.playerId] ?? [];
  const card = hand.find((c) => c.id === action.cardId);
  if (!card) throw new EngineError('INVALID_CARD', 'Card not in hand');

  const newHand = hand.filter((c) => c.id !== action.cardId);
  const clearedPeek = (state.exchangePeekIds[action.playerId] ?? []).filter(
    (id) => id !== action.cardId,
  );
  let next: GameState = syncHandCounts({
    ...state,
    hands: { ...state.hands, [action.playerId]: newHand },
    exchangePeekIds: {
      ...state.exchangePeekIds,
      [action.playerId]: clearedPeek,
    },
    trick: {
      ...state.trick,
      playedCards: [
        ...state.trick.playedCards,
        { playerId: action.playerId, card },
      ],
      abilityOpts: {
        ...state.trick.abilityOpts,
        [action.playerId]: {
          chooseStraight: action.chooseStraight,
          ignoreKrakenDamage: action.ignoreKrakenDamage,
        },
      },
    },
  });

  if (next.trick.playedCards.length < 2) {
    const other = next.players.find((p) => p.playerId !== action.playerId)!;
    return {
      ...next,
      currentTurnPlayerId: other.playerId,
    };
  }

  const winnerId = determineTrickWinner(next.trick.playedCards);
  const winnerOpts = next.trick.abilityOpts[winnerId] ?? {};

  return resolveTrick(next, {
    chooseStraight: winnerOpts.chooseStraight,
    ignoreKrakenDamage: winnerOpts.ignoreKrakenDamage,
    actingPlayerId: action.playerId,
  });
}

function resolveTrick(
  state: GameState,
  opts: {
    chooseStraight?: boolean;
    ignoreKrakenDamage?: boolean;
    actingPlayerId: string;
  },
): GameState {
  const winnerId = determineTrickWinner(state.trick.playedCards);
  const winner = state.players.find((p) => p.playerId === winnerId)!;
  const cards = state.trick.playedCards.map((t) => t.card);
  let action = resolvePairAction(cards[0].symbol, cards[1].symbol);

  let next: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.playerId === winnerId ? { ...p, tricksWon: p.tricksWon + 1 } : p,
    ),
    trick: { ...state.trick, winnerId },
    actionLog: [
      ...state.actionLog,
      `${winner.displayName} wins the trick (${symbolLabel(cards[0].symbol)}+${symbolLabel(cards[1].symbol)}).`,
    ],
  };

  // Pirate: ignore wheel+kraken damage
  if (
    action.kind === 'diagonal' &&
    action.shipDamage === 1 &&
    opts.ignoreKrakenDamage
  ) {
    const pirate = getPlayerPirate(next, winnerId);
    const usage = next.abilityUsage[winnerId];
    if (pirate?.canIgnoreKrakenHelmDamage && !usage.ignoredKrakenHelmDamage) {
      action = { kind: 'diagonal', shipDamage: 0 };
      next = {
        ...next,
        abilityUsage: {
          ...next.abilityUsage,
          [winnerId]: { ...usage, ignoredKrakenHelmDamage: true },
        },
        actionLog: [...next.actionLog, `${winner.displayName} ignores Kraken damage.`],
      };
    }
  }

  if (action.kind === 'damage_kraken') {
    const krakenCard = cards.find((c) => c.symbol === 'kraken') ?? cards[0];
    next = putUnderKrakenDeck(next, krakenCard);
    const other = cards.find((c) => c.id !== krakenCard.id)!;
    next = { ...next, discardPile: [...next.discardPile, other] };
  } else if (action.kind === 'cannon') {
    next = { ...next, discardPile: [...next.discardPile, ...cards] };
    const pirate = getPlayerPirate(next, winnerId);
    const flips = pirate?.cannonFlips ?? 1;
    for (let i = 0; i < flips; i += 1) {
      next = resolveCannonFlip(next, winner.seat);
      if (next.phase === 'WON' || next.phase === 'LOST') return finalizeTrickTurn(next, winnerId);
    }
  } else {
    next = { ...next, discardPile: [...next.discardPile, ...cards] };
    if (action.kind === 'diagonal') {
      let moveStraight = false;
      if (
        action.shipDamage === 0 &&
        opts.chooseStraight &&
        cards.every((c) => c.symbol === 'wheel')
      ) {
        const pirate = getPlayerPirate(next, winnerId);
        const usage = next.abilityUsage[winnerId];
        if (pirate?.canChooseStraightOnHelm && !usage.choseStraightOnHelm) {
          moveStraight = true;
          next = {
            ...next,
            abilityUsage: {
              ...next.abilityUsage,
              [winnerId]: { ...usage, choseStraightOnHelm: true },
            },
          };
        }
      }
      if (moveStraight) {
        next = {
          ...next,
          actionLog: [
            ...next.actionLog,
            `${winner.displayName} moves straight (Wheel+Wheel).`,
          ],
        };
        next = moveShip(next, straightTarget(next.ship.position, 1), 'forward');
      } else {
        const target = diagonalTarget(
          next.ship.position,
          winner.seat,
          next.boardCols,
          next.boardRows,
        );
        next = moveShip(
          next,
          target,
          winner.seat === 0 ? 'left' : 'right',
        );
      }
      if (next.phase === 'WON') return finalizeTrickTurn(next, winnerId);
      if (action.shipDamage > 0) {
        next = applyShipDamage(next, action.shipDamage, winnerId);
        if (next.phase === 'LOST') return finalizeTrickTurn(next, winnerId);
      }
    } else if (action.kind === 'straight') {
      let steps = action.steps;
      const pirate = getPlayerPirate(next, winnerId);
      if (pirate?.doubleMermaidMove) steps = 2;
      for (let s = 0; s < steps; s += 1) {
        next = moveShip(next, straightTarget(next.ship.position, 1), 'forward');
        if (next.phase === 'WON' || next.phase === 'LOST') {
          return finalizeTrickTurn(next, winnerId);
        }
      }
    }
  }

  // Round end if someone has 4 tricks
  const maxTricks = Math.max(...next.players.map((p) => p.tricksWon));
  if (maxTricks >= 4) {
    return endRound(next);
  }

  return {
    ...next,
    trick: {
      leadingPlayerId: winnerId,
      playedCards: [],
      winnerId: null,
      abilityOpts: {},
    },
    currentTurnPlayerId: winnerId,
  };
}

function finalizeTrickTurn(state: GameState, winnerId: string): GameState {
  if (state.phase === 'WON' || state.phase === 'LOST') return state;
  return {
    ...state,
    trick: {
      leadingPlayerId: winnerId,
      playedCards: [],
      winnerId: null,
      abilityOpts: {},
    },
    currentTurnPlayerId: winnerId,
  };
}

function resolveCannonFlip(state: GameState, winnerSeat: 0 | 1): GameState {
  if (state.playerDeck.length === 0) {
    return {
      ...state,
      actionLog: [...state.actionLog, 'Cannon action: deck empty — no effect.'],
    };
  }
  const [flipped, ...rest] = state.playerDeck;
  let next: GameState = {
    ...state,
    playerDeck: rest,
    actionLog: [
      ...state.actionLog,
      `Cannon reveals ${flipped.suit} ${flipped.value} (${flipped.symbol}).`,
    ],
  };

  if (flipped.symbol === 'wheel') {
    const target = diagonalTarget(
      next.ship.position,
      winnerSeat,
      next.boardCols,
      next.boardRows,
    );
    next = moveShip(next, target, winnerSeat === 0 ? 'left' : 'right');
    next = { ...next, discardPile: [...next.discardPile, flipped] };
  } else if (flipped.symbol === 'kraken') {
    next = putUnderKrakenDeck(next, flipped);
  } else if (flipped.symbol === 'mermaid') {
    next = moveShip(next, straightTarget(next.ship.position, 1), 'forward');
    next = { ...next, discardPile: [...next.discardPile, flipped] };
  } else if (flipped.symbol === 'cannon') {
    next = { ...next, discardPile: [...next.discardPile, flipped] };
    next = resolveCannonFlip(next, winnerSeat);
  } else {
    next = { ...next, discardPile: [...next.discardPile, flipped] };
  }
  return next;
}

function moveShip(
  state: GameState,
  target: Position,
  facing: GameState['ship']['facing'],
): GameState {
  if (state.phase === 'WON' || state.phase === 'LOST') return state;

  if (!isOnBoard(target, state.boardCols, state.boardRows)) {
    return {
      ...state,
      actionLog: [...state.actionLog, 'Ship cannot leave the board.'],
    };
  }

  const type = cellTypeAt(state, target);
  if (type === 'island') {
    return {
      ...state,
      actionLog: [...state.actionLog, 'Ship blocked by an island.'],
    };
  }

  let next: GameState = {
    ...state,
    ship: { position: { ...target }, facing },
    actionLog: [
      ...state.actionLog,
      `Ship moves to ${String.fromCharCode(65 + target.col)}${target.row}.`,
    ],
  };

  if (samePos(target, state.end) || type === 'end') {
    return {
      ...next,
      phase: 'WON',
      actionLog: [...next.actionLog, 'Reached the End — Victory!'],
    };
  }

  if (type === 'kraken') {
    next = applyShipDamage(next, 1);
  }

  return next;
}

function putUnderKrakenDeck(state: GameState, card: Card): GameState {
  return {
    ...state,
    kraken: {
      ...state.kraken,
      deck: [...state.kraken.deck, card],
    },
    actionLog: [...state.actionLog, 'Damaged the Kraken — card buried under Kraken deck.'],
  };
}

export function applyShipDamage(
  state: GameState,
  hits: number,
  mitigatorId?: string,
): GameState {
  let next = state;
  let remaining = hits;

  if (mitigatorId) {
    const pirate = getPlayerPirate(next, mitigatorId);
    const usage = next.abilityUsage[mitigatorId];
    if (pirate && pirate.damageMitigationPerRound > usage.damageMitigated) {
      const canMitigate = pirate.damageMitigationPerRound - usage.damageMitigated;
      const mitigated = Math.min(canMitigate, remaining);
      remaining -= mitigated;
      next = {
        ...next,
        abilityUsage: {
          ...next.abilityUsage,
          [mitigatorId]: {
            ...usage,
            damageMitigated: usage.damageMitigated + mitigated,
          },
        },
        actionLog:
          mitigated > 0
            ? [...next.actionLog, `Pirate ability absorbs ${mitigated} damage.`]
            : next.actionLog,
      };
    }
  }

  for (let i = 0; i < remaining; i += 1) {
    next = resolveOneDamage(next);
    if (next.phase === 'LOST') return next;
  }
  return next;
}

function resolveOneDamage(state: GameState): GameState {
  if (state.kraken.deck.length === 0) {
    return lose(state, 'KRAKEN_DECK_EMPTY', 'Kraken deck empty');
  }

  const top = state.kraken.deck[0];
  const rest = state.kraken.deck.slice(1);

  if (isKrakenSentinel(top)) {
    // Move meeple clockwise, place Kraken card at bottom
    const newIndex = state.kraken.trackerIndex + 1;
    if (newIndex >= KRAKEN_TRACK.length - 1 || 'dead' in KRAKEN_TRACK[newIndex]) {
      return lose(
        {
          ...state,
          kraken: {
            ...state.kraken,
            trackerIndex: KRAKEN_TRACK.length - 1,
            damageValue: 0,
            deck: [...rest, top],
            hasKrakenCard: true,
          },
        },
        'KRAKEN_DEAD',
        'Kraken reaches Dead',
      );
    }
    const track = KRAKEN_TRACK[newIndex];
    const newDeck = [...rest, top];
    let next: GameState = {
      ...state,
      kraken: {
        trackerIndex: newIndex,
        damageValue: track.damage,
        deck: newDeck,
        hasKrakenCard: true,
      },
      actionLog: [...state.actionLog, 'Kraken advances on the tracker!'],
    };
    if (newDeck.length === 1 && isKrakenSentinel(newDeck[0])) {
      return lose(next, 'KRAKEN_DECK_EMPTY', 'Only the Kraken card remains');
    }
    return next;
  }

  const newDeck = rest;
  let next: GameState = {
    ...state,
    kraken: {
      ...state.kraken,
      deck: newDeck,
      hasKrakenCard: newDeck.some(isKrakenSentinel),
    },
    discardPile: [...state.discardPile, top],
    actionLog: [...state.actionLog, 'Kraken damages the ship!'],
  };

  if (newDeck.length === 1 && isKrakenSentinel(newDeck[0])) {
    return lose(next, 'KRAKEN_DECK_EMPTY', 'Only the Kraken card remains');
  }
  if (newDeck.length === 0) {
    return lose(next, 'KRAKEN_DECK_EMPTY', 'Kraken deck empty');
  }
  return next;
}

function endRound(state: GameState): GameState {
  let next: GameState = {
    ...state,
    phase: 'ROUND_END',
    actionLog: [...state.actionLog, `Round ${state.currentRound} ended.`],
  };

  const hits = next.kraken.damageValue;
  if (hits > 0) {
    next = applyShipDamage(next, hits);
    if (next.phase === 'LOST') return next;
  }

  // Storm checks
  const [storm1, storm2] = next.storms;
  if (next.currentRound === 2 && !isPastStorm(next.ship.position.row, storm1)) {
    return lose(next, 'STORM_1_FAILED', 'Failed to pass the first storm');
  }
  if (next.currentRound === 4 && !isPastStorm(next.ship.position.row, storm2)) {
    return lose(next, 'STORM_2_FAILED', 'Failed to pass the second storm');
  }

  if (next.currentRound >= 5) {
    return lose(next, 'ROUND_5_ENDED', 'Round 5 ended before reaching the End');
  }

  return beginRound(next, next.currentRound + 1);
}

function lose(state: GameState, reason: LossReason, message: string): GameState {
  // Win beats simultaneous loss — if already won, keep win
  if (state.phase === 'WON') return state;
  return {
    ...state,
    phase: 'LOST',
    lossReason: reason,
    actionLog: [...state.actionLog, `Defeat — ${message}.`],
  };
}

function restartGame(state: GameState): GameState {
  const players = state.players.map((p) => ({
    ...p,
    tricksWon: 0,
    handCount: 0,
  }));
  const seed = state.seed + 1;
  let next: GameState = {
    ...state,
    phase: 'SETUP',
    seed,
    currentRound: 0,
    currentTurnPlayerId: null,
    hands: Object.fromEntries(players.map((p) => [p.playerId, []])),
    exchangeSelections: Object.fromEntries(players.map((p) => [p.playerId, null])),
    playerDeck: [],
    discardPile: [],
    trick: { leadingPlayerId: null, playedCards: [], winnerId: null, abilityOpts: {} },
    actionLog: ['Rematch — choose pirates and start again.'],
    lossReason: null,
    abilityUsage: Object.fromEntries(players.map((p) => [p.playerId, emptyAbilityUsage()])),
    players,
  };
  // Keep pirate selections for convenience
  return next;
}

function setConnected(state: GameState, playerId: string, connected: boolean): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.playerId === playerId ? { ...p, connected } : p,
    ),
  };
}

export function availablePirates() {
  return listPirates();
}

export function availableScenarios() {
  return listScenarios();
}

export type { Rng };

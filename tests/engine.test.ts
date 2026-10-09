import { describe, expect, it } from 'vitest';
import {
  addPlayer,
  applyAction,
  applyShipDamage,
  canPlayCard,
  createFullDeck,
  createInitialDecks,
  createLobbyState,
  createSeededRng,
  dealHands,
  determineTrickWinner,
  getLegalCardIds,
  isKrakenSentinel,
  resolvePairAction,
  shuffleInPlace,
  symbolForValue,
  toClientState,
} from '@sail/shared';

function twoPlayerLobby(seed = 42) {
  let state = createLobbyState('TEST01', seed);
  state = addPlayer(state, {
    playerId: 'p1',
    displayName: 'Ahab',
    connected: true,
    seat: 0,
  });
  state = addPlayer(state, {
    playerId: 'p2',
    displayName: 'Queequeg',
    connected: true,
    seat: 1,
  });
  state = applyAction(state, {
    type: 'CHOOSE_PIRATE',
    playerId: 'p1',
    pirateId: 'anne-bonny',
  });
  state = applyAction(state, {
    type: 'CHOOSE_PIRATE',
    playerId: 'p2',
    pirateId: 'mary-read',
  });
  return state;
}

describe('cards & deck', () => {
  it('creates 27 cards with correct symbols', () => {
    const deck = createFullDeck();
    expect(deck).toHaveLength(27);
    expect(symbolForValue(1)).toBe('kraken');
    expect(symbolForValue(4)).toBe('cannon');
    expect(symbolForValue(7)).toBe('wheel');
    expect(symbolForValue(9)).toBe('mermaid');
  });

  it('shuffles deterministically with seed', () => {
    const a = shuffleInPlace([1, 2, 3, 4, 5], createSeededRng(1));
    const b = shuffleInPlace([1, 2, 3, 4, 5], createSeededRng(1));
    expect(a).toEqual(b);
  });

  it('splits kraken and player decks', () => {
    const { krakenDeck, playerDeck } = createInitialDecks(7);
    expect(krakenDeck.some(isKrakenSentinel)).toBe(true);
    expect(krakenDeck.filter((c) => !isKrakenSentinel(c))).toHaveLength(6);
    expect(playerDeck).toHaveLength(21);
    expect(playerDeck.every((c) => c.value >= 3)).toBe(true);
  });

  it('deals 9 cards to each player', () => {
    const { playerDeck } = createInitialDecks(3);
    const { hands, remaining } = dealHands(playerDeck, ['p1', 'p2']);
    expect(hands.p1).toHaveLength(9);
    expect(hands.p2).toHaveLength(9);
    expect(remaining).toHaveLength(3);
  });
});

describe('trick rules', () => {
  it('requires following suit when able', () => {
    let state = twoPlayerLobby();
    state = applyAction(state, { type: 'START_GAME' });
    // Force hands
    state = {
      ...state,
      phase: 'PLAYING',
      currentTurnPlayerId: 'p1',
      trick: { leadingPlayerId: 'p1', playedCards: [], winnerId: null, abilityOpts: {} },
      hands: {
        p1: [
          { id: 'crimson-6', suit: 'crimson', value: 6, symbol: 'wheel' },
          { id: 'azure-9', suit: 'azure', value: 9, symbol: 'mermaid' },
        ],
        p2: [
          { id: 'crimson-8', suit: 'crimson', value: 8, symbol: 'wheel' },
          { id: 'gold-4', suit: 'gold', value: 4, symbol: 'cannon' },
        ],
      },
    };
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'crimson-6',
    });
    expect(getLegalCardIds(state, 'p2')).toEqual(['crimson-8']);
    expect(canPlayCard(state, 'p2', 'gold-4')).toBe(false);
  });

  it('uses trick winner pirate opts when leader wins Wheel+Wheel', () => {
    let state = twoPlayerLobby(7);
    state = applyAction(state, {
      type: 'CHOOSE_PIRATE',
      playerId: 'p1',
      pirateId: 'grace-omalley',
    });
    state = applyAction(state, { type: 'START_GAME' });
    state = {
      ...state,
      phase: 'PLAYING',
      currentTurnPlayerId: 'p1',
      ship: { position: { col: 4, row: 2 }, facing: 'forward' },
      trick: { leadingPlayerId: 'p1', playedCards: [], winnerId: null, abilityOpts: {} },
      hands: {
        p1: [{ id: 'crimson-8', suit: 'crimson', value: 8, symbol: 'wheel' }],
        p2: [{ id: 'crimson-6', suit: 'crimson', value: 6, symbol: 'wheel' }],
      },
      players: state.players.map((p) => ({ ...p, tricksWon: 0 })),
    };
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'crimson-8',
      chooseStraight: true,
    });
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'p2',
      cardId: 'crimson-6',
      chooseStraight: false,
    });
    expect(state.ship.position).toEqual({ col: 4, row: 3 });
    expect(state.actionLog.some((l) => l.includes('moves straight'))).toBe(true);
    expect(state.actionLog).not.toContain('Ship blocked by an island.');
  });

  it('determines trick winner by lead suit', () => {
    const winner = determineTrickWinner([
      { playerId: 'p1', card: { id: 'a', suit: 'azure', value: 5, symbol: 'cannon' } },
      { playerId: 'p2', card: { id: 'b', suit: 'gold', value: 9, symbol: 'mermaid' } },
    ]);
    expect(winner).toBe('p1');
  });

  it('resolves symbol pairs', () => {
    expect(resolvePairAction('wheel', 'wheel')).toEqual({
      kind: 'diagonal',
      shipDamage: 0,
    });
    expect(resolvePairAction('wheel', 'kraken')).toEqual({
      kind: 'diagonal',
      shipDamage: 1,
    });
    expect(resolvePairAction('kraken', 'kraken')).toEqual({
      kind: 'diagonal',
      shipDamage: 2,
    });
    expect(resolvePairAction('cannon', 'kraken').kind).toBe('damage_kraken');
    expect(resolvePairAction('mermaid', 'mermaid')).toEqual({
      kind: 'straight',
      steps: 1,
    });
    expect(resolvePairAction('cannon', 'cannon').kind).toBe('cannon');
    expect(resolvePairAction('wheel', 'cannon').kind).toBe('none');
  });
});

describe('game flow', () => {
  it('marks received card for Calico Jack peek after exchange', () => {
    let state = twoPlayerLobby(21);
    state = applyAction(state, {
      type: 'CHOOSE_PIRATE',
      playerId: 'p1',
      pirateId: 'calico-jack',
    });
    state = applyAction(state, { type: 'START_GAME' });
    const giveFromP1 = state.hands.p1[0]!;
    const giveFromP2 = state.hands.p2[0]!;
    state = applyAction(state, {
      type: 'EXCHANGE_CARD',
      playerId: 'p1',
      cardId: giveFromP1.id,
    });
    state = applyAction(state, {
      type: 'EXCHANGE_CARD',
      playerId: 'p2',
      cardId: giveFromP2.id,
    });
    expect(state.phase).toBe('PLAYING');
    expect(state.exchangePeekIds.p1).toEqual([giveFromP2.id]);
    expect(state.exchangePeekIds.p2).toEqual([]);
    expect(state.hands.p1.some((c) => c.id === giveFromP2.id)).toBe(true);
    const view = toClientState(state, 'p1');
    expect(view.you.peekedCardIds).toEqual([giveFromP2.id]);
    const view2 = toClientState(state, 'p2');
    expect(view2.you.peekedCardIds).toEqual([]);
  });

  it('starts game, exchanges, and plays a trick', () => {
    let state = twoPlayerLobby(99);
    state = applyAction(state, { type: 'START_GAME' });
    expect(state.phase).toBe('EXCHANGE');
    expect(state.hands.p1).toHaveLength(9);

    const c1 = state.hands.p1[0]!.id;
    const c2 = state.hands.p2[0]!.id;
    state = applyAction(state, { type: 'EXCHANGE_CARD', playerId: 'p1', cardId: c1 });
    state = applyAction(state, { type: 'EXCHANGE_CARD', playerId: 'p2', cardId: c2 });
    expect(state.phase).toBe('PLAYING');
    expect(state.currentTurnPlayerId).toBeTruthy();

    const leader = state.currentTurnPlayerId!;
    const follower = leader === 'p1' ? 'p2' : 'p1';
    const leadCard = getLegalCardIds(state, leader)[0]!;
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: leader,
      cardId: leadCard,
    });
    const followCard = getLegalCardIds(state, follower)[0]!;
    state = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: follower,
      cardId: followCard,
    });
    expect(state.trick.playedCards).toHaveLength(0);
    expect(state.players.reduce((s, p) => s + p.tricksWon, 0)).toBe(1);
  });

  it('rejects playing out of turn', () => {
    let state = twoPlayerLobby(11);
    state = applyAction(state, { type: 'START_GAME' });
    state = applyAction(state, {
      type: 'EXCHANGE_CARD',
      playerId: 'p1',
      cardId: state.hands.p1[0]!.id,
    });
    state = applyAction(state, {
      type: 'EXCHANGE_CARD',
      playerId: 'p2',
      cardId: state.hands.p2[0]!.id,
    });
    const notTurn = state.currentTurnPlayerId === 'p1' ? 'p2' : 'p1';
    expect(() =>
      applyAction(state, {
        type: 'PLAY_CARD',
        playerId: notTurn,
        cardId: state.hands[notTurn][0]!.id,
      }),
    ).toThrow(/turn/i);
  });

  it('wins when ship reaches end', () => {
    let state = twoPlayerLobby(5);
    state = applyAction(state, { type: 'START_GAME' });
    state = {
      ...state,
      phase: 'PLAYING',
      ship: { position: { col: 3, row: 16 }, facing: 'forward' },
      currentTurnPlayerId: 'p1',
      trick: { leadingPlayerId: 'p1', playedCards: [], winnerId: null, abilityOpts: {} },
      hands: {
        p1: [{ id: 'gold-9', suit: 'gold', value: 9, symbol: 'mermaid' }],
        p2: [{ id: 'azure-9', suit: 'azure', value: 9, symbol: 'mermaid' }],
      },
      players: state.players.map((p) => ({ ...p, tricksWon: 0 })),
    };
    state = applyAction(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'gold-9' });
    state = applyAction(state, { type: 'PLAY_CARD', playerId: 'p2', cardId: 'azure-9' });
    expect(state.phase).toBe('WON');
  });

  it('loses when only kraken card remains after damage', () => {
    let state = twoPlayerLobby(5);
    state = applyAction(state, { type: 'START_GAME' });
    const sentinel = state.kraken.deck.find(isKrakenSentinel)!;
    state = {
      ...state,
      kraken: {
        ...state.kraken,
        deck: [
          { id: 'crimson-1', suit: 'crimson', value: 1, symbol: 'kraken' },
          sentinel,
        ],
      },
    };
    state = applyShipDamage(state, 1);
    expect(state.phase).toBe('LOST');
    expect(state.lossReason).toBe('KRAKEN_DECK_EMPTY');
  });
});

describe('privacy projection', () => {
  it('never sends opponent hand cards', () => {
    let state = twoPlayerLobby(8);
    state = applyAction(state, { type: 'START_GAME' });
    const view = toClientState(state, 'p1');
    expect(view.you.hand).toHaveLength(9);
    expect(view.opponent.handCount).toBe(9);
    expect(JSON.stringify(view)).not.toContain(state.hands.p2[0]!.id);
  });
});

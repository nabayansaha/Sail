import type { Card } from '../types/game.js';
import { cloneCards, createFullDeck } from './cards.js';
import { createSeededRng, shuffleInPlace, type Rng } from './rng.js';

export const KRAKEN_SENTINEL_ID = 'kraken-card';

export function createKrakenSentinel(): Card {
  return {
    id: KRAKEN_SENTINEL_ID,
    suit: 'crimson',
    value: 0,
    symbol: 'kraken',
  };
}

export function isKrakenSentinel(card: Card): boolean {
  return card.id === KRAKEN_SENTINEL_ID;
}

export interface SplitDecks {
  krakenDeck: Card[];
  playerDeck: Card[];
}

export function splitDecks(full: Card[], rng: Rng): SplitDecks {
  const krakenPool = full.filter((c) => c.value <= 2);
  const playerPool = full.filter((c) => c.value >= 3);
  const krakenDeck = shuffleInPlace(cloneCards(krakenPool), rng);
  krakenDeck.push(createKrakenSentinel());
  const playerDeck = shuffleInPlace(cloneCards(playerPool), rng);
  return { krakenDeck, playerDeck };
}

export function createInitialDecks(seed: number): SplitDecks {
  const rng = createSeededRng(seed);
  return splitDecks(createFullDeck(), rng);
}

export function dealHands(
  playerDeck: Card[],
  playerIds: [string, string],
): { hands: Record<string, Card[]>; remaining: Card[] } {
  const deck = [...playerDeck];
  const hands: Record<string, Card[]> = {
    [playerIds[0]]: deck.splice(0, 9),
    [playerIds[1]]: deck.splice(0, 9),
  };
  return { hands, remaining: deck };
}

export function reshapePlayerDeck(
  playerDeck: Card[],
  discardPile: Card[],
  hands: Record<string, Card[]>,
  rng: Rng,
): Card[] {
  const all = [
    ...cloneCards(playerDeck),
    ...cloneCards(discardPile),
    ...Object.values(hands).flatMap((h) => cloneCards(h)),
  ].filter((c) => !isKrakenSentinel(c));
  return shuffleInPlace(all, rng);
}

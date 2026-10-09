import type { Card, CardSymbol, Suit } from '../types/game.js';

export const SUITS: Suit[] = ['crimson', 'azure', 'gold'];

export function symbolForValue(value: number): CardSymbol {
  if (value >= 1 && value <= 3) return 'kraken';
  if (value >= 4 && value <= 5) return 'cannon';
  if (value >= 6 && value <= 8) return 'wheel';
  if (value === 9) return 'mermaid';
  throw new Error(`Invalid card value: ${value}`);
}

export function createCard(suit: Suit, value: number): Card {
  return {
    id: `${suit}-${value}`,
    suit,
    value,
    symbol: symbolForValue(value),
  };
}

/** All 27 playing cards (3 suits × 1–9). */
export function createFullDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 9; value += 1) {
      cards.push(createCard(suit, value));
    }
  }
  return cards;
}

export function cloneCard(card: Card): Card {
  return { ...card };
}

export function cloneCards(cards: Card[]): Card[] {
  return cards.map(cloneCard);
}

const SYMBOL_LABELS: Record<CardSymbol, string> = {
  wheel: 'Wheel',
  kraken: 'Kraken',
  cannon: 'Cannon',
  mermaid: 'Mermaid',
};

export function symbolLabel(symbol: CardSymbol): string {
  return SYMBOL_LABELS[symbol];
}

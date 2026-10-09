import type { Card, CardSymbol, GameState, Position, Suit } from '../types/game.js';
import { samePos } from './scenarios.js';

export type PairAction =
  | { kind: 'diagonal'; shipDamage: number }
  | { kind: 'straight'; steps: number }
  | { kind: 'damage_kraken' }
  | { kind: 'cannon' }
  | { kind: 'none' };

export function getLegalCardIds(state: GameState, playerId: string): string[] {
  if (state.phase !== 'PLAYING') return [];
  if (state.currentTurnPlayerId !== playerId) return [];
  const hand = state.hands[playerId] ?? [];
  const lead = state.trick.playedCards[0];
  if (!lead) return hand.map((c) => c.id);
  const leadSuit = lead.card.suit;
  const matching = hand.filter((c) => c.suit === leadSuit);
  if (matching.length > 0) return matching.map((c) => c.id);
  return hand.map((c) => c.id);
}

export function canPlayCard(state: GameState, playerId: string, cardId: string): boolean {
  return getLegalCardIds(state, playerId).includes(cardId);
}

export function determineTrickWinner(played: { playerId: string; card: Card }[]): string {
  if (played.length !== 2) throw new Error('Trick requires two cards');
  const leadSuit: Suit = played[0].card.suit;
  const ofSuit = played.filter((p) => p.card.suit === leadSuit);
  const best = ofSuit.reduce((a, b) => (b.card.value > a.card.value ? b : a));
  return best.playerId;
}

export function resolvePairAction(a: CardSymbol, b: CardSymbol): PairAction {
  if (a === 'wheel' && b === 'wheel') return { kind: 'diagonal', shipDamage: 0 };
  if (
    (a === 'wheel' && b === 'kraken') ||
    (a === 'kraken' && b === 'wheel')
  ) {
    return { kind: 'diagonal', shipDamage: 1 };
  }
  if (a === 'kraken' && b === 'kraken') return { kind: 'diagonal', shipDamage: 2 };
  if (
    (a === 'cannon' && b === 'kraken') ||
    (a === 'kraken' && b === 'cannon')
  ) {
    return { kind: 'damage_kraken' };
  }
  if (a === 'mermaid' && b === 'mermaid') return { kind: 'straight', steps: 1 };
  if (a === 'cannon' && b === 'cannon') return { kind: 'cannon' };
  return { kind: 'none' };
}

export function isOnBoard(pos: Position, cols: number, rows: number): boolean {
  return pos.col >= 0 && pos.col < cols && pos.row >= 1 && pos.row <= rows;
}

export function cellTypeAt(state: GameState, pos: Position): string {
  const cell = state.board.find((c) => samePos(c.position, pos));
  return cell?.type ?? 'empty';
}

export function isPastStorm(shipRow: number, stormRow: number): boolean {
  return shipRow > stormRow;
}

/** Winner seat 0 pulls toward col 0; seat 1 toward col 6. */
export function diagonalTarget(
  from: Position,
  winnerSeat: 0 | 1,
  _cols: number,
  _rows: number,
): Position {
  const colDelta = winnerSeat === 0 ? -1 : 1;
  return {
    col: from.col + colDelta,
    row: from.row + 1,
  };
}

export function straightTarget(from: Position, steps: number): Position {
  return { col: from.col, row: from.row + steps };
}

export function leadSeatForRound(round: number): 0 | 1 {
  return round % 2 === 1 ? 0 : 1;
}

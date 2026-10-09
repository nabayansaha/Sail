export type Suit = 'crimson' | 'azure' | 'gold';

export type CardSymbol = 'kraken' | 'cannon' | 'wheel' | 'mermaid';

export type GamePhase =
  | 'LOBBY'
  | 'SETUP'
  | 'EXCHANGE'
  | 'PLAYING'
  | 'ROUND_END'
  | 'WON'
  | 'LOST';

export type CellType = 'empty' | 'island' | 'kraken' | 'start' | 'end';

export interface Position {
  col: number; // 0-6 (A-G)
  row: number; // 1-based
}

export interface Card {
  id: string;
  suit: Suit;
  value: number; // 1-9
  symbol: CardSymbol;
}

export interface PlayerPublic {
  playerId: string;
  displayName: string;
  pirateId: string | null;
  connected: boolean;
  seat: 0 | 1;
  tricksWon: number;
  handCount: number;
}

export interface TrickCard {
  playerId: string;
  card: Card;
}

export interface TrickAbilityOpts {
  chooseStraight?: boolean;
  ignoreKrakenDamage?: boolean;
}

export interface TrickState {
  leadingPlayerId: string | null;
  playedCards: TrickCard[];
  winnerId: string | null;
  /** Pirate ability flags submitted with each player's card this trick */
  abilityOpts: Record<string, TrickAbilityOpts>;
}

export interface ShipState {
  position: Position;
  facing: 'forward' | 'left' | 'right';
}

export interface KrakenState {
  /** Index on the circular tracker; last index is Dead */
  trackerIndex: number;
  /** Damage value under current meeple space (end-of-round hits) */
  damageValue: number;
  deck: Card[];
  /** Whether the special Kraken card is still in the deck */
  hasKrakenCard: boolean;
}

export interface BoardCell {
  position: Position;
  type: CellType;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3;
  reconstructed: boolean;
  cols: number;
  rows: number;
  start: Position;
  end: Position;
  storms: number[];
  islands: Position[];
  krakenSpaces: Position[];
}

export interface PirateDefinition {
  id: string;
  name: string;
  description: string;
  reconstructed: boolean;
  /** When resolving cannon+cannon, flip this many cards (default 1) */
  cannonFlips: number;
  /** Ignore this many ship-damage hits per round */
  damageMitigationPerRound: number;
  /** Always 1 in Sail — both players must exchange the same count */
  exchangeCount: number;
  /** After blind exchange, may peek at the card received before play starts */
  peekExchange: boolean;
  /** Once per round: treat a Kraken+Wheel as Wheel+Wheel (no damage) */
  canIgnoreKrakenHelmDamage: boolean;
  /** When winning with Mermaid+Mermaid, move 2 straight instead of 1 */
  doubleMermaidMove: boolean;
  /** Once per round when winning a wheel pair, choose straight instead of diagonal */
  canChooseStraightOnHelm: boolean;
}

export type LossReason =
  | 'ROUND_5_ENDED'
  | 'STORM_1_FAILED'
  | 'STORM_2_FAILED'
  | 'KRAKEN_DECK_EMPTY'
  | 'KRAKEN_DEAD'
  | null;

export interface GameState {
  phase: GamePhase;
  roomCode: string;
  scenarioId: string;
  players: PlayerPublic[];
  currentRound: number;
  currentTurnPlayerId: string | null;
  /** Private hands keyed by playerId — stripped for opponent in projections */
  hands: Record<string, Card[]>;
  /** Pending exchange selections */
  exchangeSelections: Record<string, string | null>;
  /** Card ids received in the last exchange (only for peekExchange pirates) */
  exchangePeekIds: Record<string, string[]>;
  playerDeck: Card[];
  discardPile: Card[];
  trick: TrickState;
  ship: ShipState;
  kraken: KrakenState;
  board: BoardCell[];
  storms: number[];
  start: Position;
  end: Position;
  boardCols: number;
  boardRows: number;
  actionLog: string[];
  lossReason: LossReason;
  /** Per-player pirate ability usage this round */
  abilityUsage: Record<
    string,
    {
      ignoredKrakenHelmDamage: boolean;
      choseStraightOnHelm: boolean;
      damageMitigated: number;
    }
  >;
  seed: number;
}

/** Public view for a specific player */
export interface ClientGameState {
  phase: GamePhase;
  roomCode: string;
  scenarioId: string;
  scenarioName: string;
  players: PlayerPublic[];
  currentRound: number;
  currentTurnPlayerId: string | null;
  you: {
    playerId: string;
    hand: Card[];
    pirateId: string | null;
    exchangeSelected: boolean;
    exchangeSelectedCount: number;
    /** Cards received in the last exchange (Calico Jack peek) */
    peekedCardIds: string[];
  };
  opponent: {
    playerId: string | null;
    handCount: number;
    pirateId: string | null;
    exchangeSelected: boolean;
    exchangeSelectedCount: number;
  };
  discardPile: Card[];
  playerDeckCount: number;
  trick: TrickState;
  ship: ShipState;
  kraken: {
    trackerIndex: number;
    damageValue: number;
    deck: Card[];
    hasKrakenCard: boolean;
    deckCount: number;
  };
  board: BoardCell[];
  storms: number[];
  start: Position;
  end: Position;
  boardCols: number;
  boardRows: number;
  actionLog: string[];
  lossReason: LossReason;
  legalCardIds: string[];
  pirates: PirateDefinition[];
  scenarios: ScenarioDefinition[];
}

export type EngineAction =
  | { type: 'CHOOSE_PIRATE'; playerId: string; pirateId: string }
  | { type: 'CHOOSE_SCENARIO'; playerId: string; scenarioId: string }
  | { type: 'START_GAME' }
  | { type: 'EXCHANGE_CARD'; playerId: string; cardId: string }
  | {
      type: 'PLAY_CARD';
      playerId: string;
      cardId: string;
      chooseStraight?: boolean;
      ignoreKrakenDamage?: boolean;
    }
  | { type: 'RESTART' }
  | { type: 'SET_CONNECTED'; playerId: string; connected: boolean };

export class EngineError extends Error {
  constructor(
    public code:
      | 'INVALID_ROOM'
      | 'ROOM_FULL'
      | 'INVALID_CARD'
      | 'NOT_YOUR_TURN'
      | 'ILLEGAL_MOVE'
      | 'GAME_ALREADY_STARTED'
      | 'INVALID_PHASE'
      | 'PIRATE_TAKEN'
      | 'NOT_READY'
      | 'UNKNOWN',
    message: string,
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

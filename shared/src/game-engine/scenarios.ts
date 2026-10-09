import type { BoardCell, Position, ScenarioDefinition } from '../types/game.js';

function pos(col: number, row: number): Position {
  return { col, row };
}

/** Reconstructed Training Voyage (Scenario 1). */
export const SCENARIO_1: ScenarioDefinition = {
  id: 'scenario-1',
  name: 'Training Voyage',
  description: 'A gentle first crossing — learn the ropes with lighter hazards.',
  difficulty: 1,
  reconstructed: true,
  cols: 7,
  rows: 17,
  start: pos(3, 1),
  end: pos(3, 17),
  storms: [5, 12],
  islands: [
    pos(3, 3),
    pos(6, 6),
    pos(0, 10),
    pos(2, 10),
    pos(6, 12),
    pos(0, 14),
    pos(2, 17),
    pos(4, 17),
  ],
  krakenSpaces: [pos(6, 4), pos(0, 6), pos(3, 7), pos(4, 12)],
};

/** Reconstructed Crosswind-style route. */
export const SCENARIO_2: ScenarioDefinition = {
  id: 'scenario-2',
  name: 'Crosswind',
  description: 'Islands squeeze the channel; storms come early.',
  difficulty: 2,
  reconstructed: true,
  cols: 7,
  rows: 17,
  start: pos(3, 1),
  end: pos(3, 17),
  storms: [5, 12],
  islands: [
    pos(3, 3),
    pos(6, 6),
    pos(0, 10),
    pos(2, 10),
    pos(6, 12),
    pos(0, 14),
    pos(2, 17),
    pos(4, 17),
    pos(1, 8),
    pos(5, 9),
  ],
  krakenSpaces: [pos(6, 4), pos(0, 6), pos(3, 7), pos(4, 12), pos(2, 5)],
};

/** Reconstructed False Calm — longer board, denser kraken. */
export const SCENARIO_3: ScenarioDefinition = {
  id: 'scenario-3',
  name: 'False Calm',
  description: 'A longer sea with quiet waters that hide the Kraken.',
  difficulty: 3,
  reconstructed: true,
  cols: 7,
  rows: 19,
  start: pos(3, 1),
  end: pos(3, 19),
  storms: [5, 14],
  islands: [
    pos(3, 3),
    pos(6, 6),
    pos(2, 10),
    pos(6, 10),
    pos(0, 12),
    pos(3, 15),
    pos(2, 19),
    pos(4, 19),
  ],
  krakenSpaces: [
    pos(6, 4),
    pos(0, 6),
    pos(3, 7),
    pos(4, 12),
    pos(5, 15),
    pos(1, 14),
  ],
};

export const SCENARIOS: ScenarioDefinition[] = [
  SCENARIO_1,
  SCENARIO_2,
  SCENARIO_3,
];

export function getScenario(id: string): ScenarioDefinition {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown scenario: ${id}`);
  return found;
}

export function listScenarios(): ScenarioDefinition[] {
  return SCENARIOS.map((s) => ({
    ...s,
    start: { ...s.start },
    end: { ...s.end },
    storms: [...s.storms],
    islands: s.islands.map((p) => ({ ...p })),
    krakenSpaces: s.krakenSpaces.map((p) => ({ ...p })),
  }));
}

export function buildBoard(scenario: ScenarioDefinition): BoardCell[] {
  const cells: BoardCell[] = [];
  const islandSet = new Set(scenario.islands.map((p) => key(p)));
  const krakenSet = new Set(scenario.krakenSpaces.map((p) => key(p)));

  for (let row = 1; row <= scenario.rows; row += 1) {
    for (let col = 0; col < scenario.cols; col += 1) {
      const p = pos(col, row);
      let type: BoardCell['type'] = 'empty';
      if (p.col === scenario.start.col && p.row === scenario.start.row) type = 'start';
      else if (p.col === scenario.end.col && p.row === scenario.end.row) type = 'end';
      else if (islandSet.has(key(p))) type = 'island';
      else if (krakenSet.has(key(p))) type = 'kraken';
      cells.push({ position: p, type });
    }
  }
  return cells;
}

export function key(p: Position): string {
  return `${p.col},${p.row}`;
}

export function samePos(a: Position, b: Position): boolean {
  return a.col === b.col && a.row === b.row;
}

export function colLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

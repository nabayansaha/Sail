import type { PirateDefinition } from '../types/game.js';

/**
 * Reconstructed pirate powers for private play.
 * One pattern (double cannon flips) is attested in published reviews;
 * the rest approximate typical asymmetric designs and are easy to correct.
 */
export const PIRATES: PirateDefinition[] = [
  {
    id: 'anne-bonny',
    name: 'Anne Bonny',
    description: 'When resolving Cannon+Cannon, flip two cards instead of one.',
    reconstructed: true,
    cannonFlips: 2,
    damageMitigationPerRound: 0,
    exchangeCount: 1,
    peekExchange: false,
    canIgnoreKrakenHelmDamage: false,
    doubleMermaidMove: false,
    canChooseStraightOnHelm: false,
  },
  {
    id: 'mary-read',
    name: 'Mary Read',
    description: 'Once per round, ignore ship damage from a Wheel+Kraken combo you win.',
    reconstructed: true,
    cannonFlips: 1,
    damageMitigationPerRound: 0,
    exchangeCount: 1,
    peekExchange: false,
    canIgnoreKrakenHelmDamage: true,
    doubleMermaidMove: false,
    canChooseStraightOnHelm: false,
  },
  {
    id: 'blackbeard',
    name: 'Blackbeard',
    description: 'Ignore one ship-damage hit each round (any source).',
    reconstructed: true,
    cannonFlips: 1,
    damageMitigationPerRound: 1,
    exchangeCount: 1,
    peekExchange: false,
    canIgnoreKrakenHelmDamage: false,
    doubleMermaidMove: false,
    canChooseStraightOnHelm: false,
  },
  {
    id: 'calico-jack',
    name: 'Calico Jack',
    description:
      'After the blind exchange, you learn which card you received (partner stays blind).',
    reconstructed: true,
    cannonFlips: 1,
    damageMitigationPerRound: 0,
    exchangeCount: 1,
    peekExchange: true,
    canIgnoreKrakenHelmDamage: false,
    doubleMermaidMove: false,
    canChooseStraightOnHelm: false,
  },
  {
    id: 'zheng-yi-sao',
    name: 'Zheng Yi Sao',
    description: 'When you win Mermaid+Mermaid, move the ship straight two spaces.',
    reconstructed: true,
    cannonFlips: 1,
    damageMitigationPerRound: 0,
    exchangeCount: 1,
    peekExchange: false,
    canIgnoreKrakenHelmDamage: false,
    doubleMermaidMove: true,
    canChooseStraightOnHelm: false,
  },
  {
    id: 'grace-omalley',
    name: "Grace O'Malley",
    description: 'Once per round when you win a Wheel+Wheel, you may move straight instead of diagonal.',
    reconstructed: true,
    cannonFlips: 1,
    damageMitigationPerRound: 0,
    exchangeCount: 1,
    peekExchange: false,
    canIgnoreKrakenHelmDamage: false,
    doubleMermaidMove: false,
    canChooseStraightOnHelm: true,
  },
];

export function getPirate(id: string): PirateDefinition {
  const found = PIRATES.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown pirate: ${id}`);
  return found;
}

export function listPirates(): PirateDefinition[] {
  return PIRATES.map((p) => ({ ...p }));
}

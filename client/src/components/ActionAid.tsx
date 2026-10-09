/** Teal player-aid panel modeled after the physical ACTION COMBINATIONS card. */

const COMBOS = [
  {
    pair: ['wheel', 'wheel'] as const,
    title: 'Wheel + Wheel',
    effect: 'Ship moves diagonally forward toward the trick winner.',
  },
  {
    pair: ['wheel', 'kraken'] as const,
    title: 'Wheel + Kraken',
    effect: 'Diagonal toward winner + Kraken damages the ship once.',
  },
  {
    pair: ['kraken', 'kraken'] as const,
    title: 'Kraken + Kraken',
    effect: 'Diagonal toward winner + Kraken damages the ship twice.',
  },
  {
    pair: ['cannon', 'kraken'] as const,
    title: 'Cannon + Kraken',
    effect: 'Damage the Kraken (bury the Kraken card under its deck).',
  },
  {
    pair: ['mermaid', 'mermaid'] as const,
    title: 'Mermaid + Mermaid',
    effect: 'Ship moves straight forward one space.',
  },
  {
    pair: ['cannon', 'cannon'] as const,
    title: 'Cannon + Cannon',
    effect: 'Flip top player-deck card → resolve Cannon Action.',
  },
] as const;

const CANNON_ACTIONS = [
  { symbol: 'wheel' as const, effect: 'Diagonal toward trick winner' },
  { symbol: 'kraken' as const, effect: 'Bury card under Kraken deck' },
  { symbol: 'mermaid' as const, effect: 'Straight forward one space' },
  { symbol: 'cannon' as const, effect: 'Flip another card' },
];

const SYMBOL_COLOR: Record<string, string> = {
  wheel: '#1a5a62',
  kraken: '#c23b3b',
  cannon: '#b8860b',
  mermaid: '#2a6a9a',
};

export function ActionAid({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="overflow-hidden rounded-xl border-2 border-[#3a7a78] bg-[#2f8a86] text-[#f2fffc] shadow-lg">
      <div className="border-b border-white/20 bg-[#267a76] px-2 py-1.5 text-center">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.12em]">
          Action Combinations
        </h3>
      </div>

      <div className={`space-y-1 ${compact ? 'p-1.5' : 'p-2.5'}`}>
        {COMBOS.map((combo) => (
          <div
            key={combo.title}
            className="rounded-md bg-[#1f6a66]/55 px-1.5 py-1 ring-1 ring-white/15"
          >
            <div className="flex items-center gap-1">
              <MiniSymbol symbol={combo.pair[0]} />
              <span className="text-[9px] opacity-70">+</span>
              <MiniSymbol symbol={combo.pair[1]} />
              <span className="ml-1 text-[10px] font-bold tracking-wide">
                {combo.title}
              </span>
            </div>
            {!compact && (
              <p className="mt-0.5 text-[10px] leading-snug text-[#e8fffa]/90">
                {combo.effect}
              </p>
            )}
            {compact && (
              <p className="text-[9px] leading-snug text-[#e8fffa]/85 line-clamp-2">
                {combo.effect}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/20 bg-[#267a76] px-2 py-1.5">
        <h4 className="mb-1 text-center text-[9px] font-bold uppercase tracking-[0.14em]">
          Cannon Actions
        </h4>
        <ul className="space-y-0.5">
          {CANNON_ACTIONS.map((row) => (
            <li key={row.symbol} className="flex items-center gap-1.5 text-[9px]">
              <MiniSymbol symbol={row.symbol} light />
              <span>{row.effect}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function MiniSymbol({ symbol, light }: { symbol: string; light?: boolean }) {
  const color = light ? '#f2fffc' : SYMBOL_COLOR[symbol] ?? '#1a5a62';
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/90"
      style={{ color }}
      title={symbol}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
        {symbol === 'wheel' && (
          <>
            <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </>
        )}
        {symbol === 'kraken' && (
          <>
            <circle cx="8" cy="5" r="3" fill="currentColor" />
            <path
              d="M5 7c-1 3-2 5-2.5 6M8 8v6M11 7c1 3 2 5 2.5 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </>
        )}
        {symbol === 'cannon' && (
          <rect x="2" y="6" width="11" height="4" rx="1.5" fill="currentColor" />
        )}
        {symbol === 'mermaid' && (
          <path
            d="M8 2c3 2 4 5 3 8-2-1-4-1-6 0-1-3 0-6 3-8z"
            fill="currentColor"
          />
        )}
      </svg>
    </span>
  );
}

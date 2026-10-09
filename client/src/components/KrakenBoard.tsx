import { KrakenSvg } from './KrakenSvg';

interface Props {
  trackerIndex: number;
  damageValue: number;
  deckCount: number;
  flash?: boolean;
}

const TRACK_LABELS = ['0', '1', '2', '3', '4', '5', '☠'];

export function KrakenBoard({
  trackerIndex,
  damageValue,
  deckCount,
  flash,
}: Props) {
  return (
    <div className="rounded-2xl border border-[var(--color-sea-500)]/40 bg-[var(--color-sea-900)]/80 p-3">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-[var(--color-sea-300)]">
        <span>Kraken</span>
        <span>Deck {deckCount}</span>
      </div>
      <div className="flex items-center gap-3">
        <KrakenSvg damaged={flash} className="h-16 w-16 shrink-0" />
        <div className="flex flex-1 flex-wrap gap-1">
          {TRACK_LABELS.map((label, i) => (
            <div
              key={label}
              className={`
                flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold
                ${
                  i === trackerIndex
                    ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/30 text-white'
                    : 'border-[var(--color-sea-700)] text-[var(--color-sea-300)]'
                }
              `}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-[var(--color-foam)]/80">
        End-of-round damage: <strong>{damageValue}</strong>
      </p>
    </div>
  );
}

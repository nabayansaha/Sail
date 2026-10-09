import { PirateCard } from '../components/PirateCard';
import { useGameStore } from '../store/gameStore';

export function Lobby() {
  const state = useGameStore((s) => s.state);
  const roomCode = useGameStore((s) => s.roomCode);
  const playerId = useGameStore((s) => s.playerId);
  const pirates = useGameStore((s) => s.pirates);
  const choosePirate = useGameStore((s) => s.choosePirate);
  const chooseScenario = useGameStore((s) => s.chooseScenario);
  const startGame = useGameStore((s) => s.startGame);
  const leaveRoom = useGameStore((s) => s.leaveRoom);
  const error = useGameStore((s) => s.error);

  const myPirate = state?.you.pirateId;
  const scenarios = state?.scenarios ?? [];
  const selectedScenario = state?.scenarioId ?? 'scenario-1';
  const bothReady =
    state?.players.length === 2 &&
    state.players.every((p) => p.pirateId);
  const link =
    typeof window !== 'undefined' && roomCode
      ? `${window.location.origin}?room=${roomCode}`
      : '';

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-[var(--color-foam)]">
            Lobby
          </h2>
          <p className="mt-1 text-[var(--color-sea-300)]">
            Room <span className="font-mono text-xl text-[var(--color-brass)]">{roomCode}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={leaveRoom}
          className="text-sm text-[var(--color-sea-300)] underline"
        >
          Leave
        </button>
      </div>

      {link && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="rounded-lg bg-[var(--color-sea-900)] px-3 py-2 text-sm">
            {link}
          </code>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(link)}
            className="rounded-lg border border-[var(--color-sea-500)]/40 px-3 py-2 text-sm"
          >
            Copy link
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {state?.players.map((p) => (
          <div
            key={p.playerId}
            className="rounded-xl border border-[var(--color-sea-500)]/30 bg-[var(--color-sea-900)]/60 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {p.displayName}
                {p.playerId === playerId ? ' (you)' : ''}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${p.connected ? 'bg-emerald-400' : 'bg-red-400'}`}
                title={p.connected ? 'Connected' : 'Disconnected'}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--color-sea-300)]">
              {p.seat === 0 ? 'A-side' : 'G-side'}
              {' · '}
              {p.pirateId
                ? pirates.find((x) => x.id === p.pirateId)?.name ?? p.pirateId
                : 'Choosing pirate…'}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--color-ink)]/50">
              {p.seat === 0
                ? 'Board reads Start → End (left to right)'
                : 'Board mirrored: End ← Start (right to left)'}
            </p>
          </div>
        ))}
        {(state?.players.length ?? 0) < 2 && (
          <div className="rounded-xl border border-dashed border-[var(--color-sea-500)]/40 p-4 text-[var(--color-sea-300)]">
            Waiting for second player…
          </div>
        )}
      </div>

      <h3 className="mt-10 font-display text-xl text-[var(--color-foam)]">
        Choose scenario
      </h3>
      <p className="mt-1 text-sm text-[var(--color-ink)]/60">
        Either player can set the voyage. Reconstructed layouts — correctable later.
      </p>
      <div className="mt-4 grid gap-3">
        {scenarios.map((scenario) => {
          const selected = selectedScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => chooseScenario(scenario.id)}
              className={`
                rounded-xl border p-4 text-left transition
                ${selected ? 'border-[var(--color-brass)] bg-[var(--color-brass)]/10' : 'border-[var(--color-sea-500)]/30 bg-[var(--color-sea-900)]/50 hover:border-[var(--color-sea-300)]'}
              `}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--color-foam)]">
                  {scenario.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-brass)]">
                  {'★'.repeat(scenario.difficulty)}
                  {'☆'.repeat(3 - scenario.difficulty)}
                </span>
                {scenario.reconstructed && (
                  <span className="text-[10px] uppercase text-[var(--color-sea-300)]">
                    approx
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink)]/70">
                {scenario.description}
              </p>
              <p className="mt-1 text-xs text-[var(--color-sea-300)]">
                Storms at rows {scenario.storms.join(' & ')} · End at{' '}
                {String.fromCharCode(65 + scenario.end.col)}
                {scenario.end.row}
              </p>
            </button>
          );
        })}
      </div>

      <h3 className="mt-10 font-display text-xl text-[var(--color-foam)]">
        Choose your pirate
      </h3>
      <p className="mt-1 text-sm text-[var(--color-ink)]/60">
        Stylized original portraits — abilities are reconstructed approximations.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {pirates.map((pirate) => {
          const taken = state?.players.some(
            (p) => p.pirateId === pirate.id && p.playerId !== playerId,
          );
          const selected = myPirate === pirate.id;
          return (
            <PirateCard
              key={pirate.id}
              pirate={pirate}
              selected={selected}
              taken={taken}
              onClick={() => choosePirate(pirate.id)}
            />
          );
        })}
      </div>
      {myPirate && (
        <p className="mt-3 text-sm text-[var(--color-sea-300)]">
          {pirates.find((p) => p.id === myPirate)?.description}
        </p>
      )}

      {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}

      <button
        type="button"
        disabled={!bothReady}
        onClick={startGame}
        className="mt-8 w-full rounded-xl bg-[var(--color-brass)] py-3 font-semibold text-[var(--color-sea-950)] disabled:opacity-40"
      >
        Start game
      </button>
    </div>
  );
}

import { useGameStore } from '../store/gameStore';

export function GameOver() {
  const state = useGameStore((s) => s.state);
  const restartGame = useGameStore((s) => s.restartGame);
  const leaveRoom = useGameStore((s) => s.leaveRoom);

  const won = state?.phase === 'WON';

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-sea-300)]">
        Voyage complete
      </p>
      <h2
        className={`mt-2 font-display text-5xl font-bold ${
          won ? 'text-[var(--color-brass)]' : 'text-[var(--color-danger)]'
        }`}
      >
        {won ? 'Victory!' : 'Defeat'}
      </h2>
      <p className="mt-4 text-[var(--color-ink)]/80">
        {won
          ? 'You reached the End token before the Kraken claimed the ship.'
          : state?.lossReason
            ? `Lost: ${state.lossReason.replaceAll('_', ' ').toLowerCase()}.`
            : 'The sea claims another crew.'}
      </p>
      {state && (
        <p className="mt-2 text-sm text-[var(--color-sea-300)]">
          Round {state.currentRound} · Ship at{' '}
          {String.fromCharCode(65 + state.ship.position.col)}
          {state.ship.position.row}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={restartGame}
          className="flex-1 rounded-xl bg-[var(--color-brass)] py-3 font-semibold text-[var(--color-sea-950)]"
        >
          Rematch
        </button>
        <button
          type="button"
          onClick={leaveRoom}
          className="flex-1 rounded-xl border border-[var(--color-sea-500)]/50 py-3"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

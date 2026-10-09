import { useGameStore } from '../store/gameStore';

export function Landing() {
  const setScreen = useGameStore((s) => s.setScreen);
  const displayName = useGameStore((s) => s.displayName);
  const setDisplayName = useGameStore((s) => s.setDisplayName);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
      <div className="animate-fade-up">
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-[var(--color-sea-300)]">
          Cooperative trick-taking
        </p>
        <h1 className="font-display text-6xl font-bold tracking-tight text-[var(--color-foam)] md:text-7xl">
          Sail
        </h1>
        <p className="mt-4 max-w-md text-lg text-[var(--color-ink)]/80">
          Two pirates. One ship. Read each other without words — and outrun the
          Kraken.
        </p>
      </div>

      <label className="mt-10 block animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--color-sea-300)]">
          Your name
        </span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Captain"
          className="w-full rounded-xl border border-[var(--color-sea-500)]/50 bg-[var(--color-sea-900)]/80 px-4 py-3 text-[var(--color-ink)] outline-none focus:border-[var(--color-brass)]"
          maxLength={24}
        />
      </label>

      <div
        className="mt-6 flex flex-col gap-3 animate-fade-up sm:flex-row"
        style={{ animationDelay: '0.2s' }}
      >
        <button
          type="button"
          onClick={() => setScreen('create')}
          className="flex-1 rounded-xl bg-[var(--color-brass)] px-5 py-3 font-semibold text-[var(--color-sea-950)] transition hover:brightness-110"
        >
          Create Game
        </button>
        <button
          type="button"
          onClick={() => setScreen('join')}
          className="flex-1 rounded-xl border border-[var(--color-sea-300)]/50 px-5 py-3 font-semibold text-[var(--color-foam)] transition hover:bg-[var(--color-sea-800)]"
        >
          Join Game
        </button>
      </div>
    </div>
  );
}

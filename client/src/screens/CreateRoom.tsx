import { useGameStore } from '../store/gameStore';

export function CreateRoom() {
  const createRoom = useGameStore((s) => s.createRoom);
  const setScreen = useGameStore((s) => s.setScreen);
  const displayName = useGameStore((s) => s.displayName);
  const setDisplayName = useGameStore((s) => s.setDisplayName);
  const connecting = useGameStore((s) => s.connecting);
  const error = useGameStore((s) => s.error);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h2 className="font-display text-3xl font-bold text-[var(--color-foam)]">
        Create room
      </h2>
      <p className="mt-2 text-[var(--color-ink)]/70">
        You&apos;ll get a 6-character code to share with your partner.
      </p>
      <label className="mt-8 block">
        <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--color-sea-300)]">
          Your name
        </span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-sea-500)]/50 bg-[var(--color-sea-900)]/80 px-4 py-3 outline-none focus:border-[var(--color-brass)]"
        />
      </label>
      {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setScreen('landing')}
          className="rounded-xl border border-[var(--color-sea-500)]/40 px-4 py-3"
        >
          Back
        </button>
        <button
          type="button"
          disabled={connecting}
          onClick={createRoom}
          className="flex-1 rounded-xl bg-[var(--color-brass)] px-4 py-3 font-semibold text-[var(--color-sea-950)] disabled:opacity-50"
        >
          {connecting ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  );
}

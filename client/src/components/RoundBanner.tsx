import { useEffect, useRef, useState } from 'react';

interface Props {
  round: number;
  phase: string;
}

/** Slow interstitial when the round number advances. */
export function RoundBanner({ round, phase }: Props) {
  const prevRound = useRef<number | null>(null);
  const [banner, setBanner] = useState<{ ended: number; next: number } | null>(
    null,
  );

  useEffect(() => {
    if (prevRound.current === null) {
      prevRound.current = round;
      return;
    }
    if (round > prevRound.current && (phase === 'EXCHANGE' || phase === 'PLAYING')) {
      const ended = prevRound.current;
      setBanner({ ended, next: round });
      prevRound.current = round;
      const t = window.setTimeout(() => setBanner(null), 3200);
      return () => window.clearTimeout(t);
    }
    prevRound.current = round;
  }, [round, phase]);

  if (!banner) return null;

  return (
    <div
      className="animate-round-veil pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#0a2233f2_0%,#06141ff5_70%)]"
      aria-live="polite"
    >
      <div className="text-center">
        <p className="animate-round-title font-display text-3xl font-bold tracking-wide text-[var(--color-foam)] md:text-4xl">
          Round {banner.ended} ended
        </p>
        <p className="animate-round-subtitle mt-3 font-display text-xl text-[var(--color-brass)] md:text-2xl">
          Round {banner.next} begins
        </p>
      </div>
    </div>
  );
}

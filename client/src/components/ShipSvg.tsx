interface Props {
  facing?: 'forward' | 'left' | 'right';
  /** Opposite seat sees the voyage mirrored (bow toward End still). */
  mirrored?: boolean;
  className?: string;
}

/** Ship art for horizontal board; bow points toward End in the viewer's frame. */
export function ShipSvg({
  facing = 'forward',
  mirrored = false,
  className = '',
}: Props) {
  // Base art points up; +90° = bow right (Start→End for seat 0)
  // Mirrored seat: bow left (End is on the left of their screen)
  let rotate = mirrored ? -90 : 90;
  if (facing === 'left') rotate += mirrored ? 28 : -28;
  if (facing === 'right') rotate += mirrored ? -28 : 28;

  return (
    <svg
      viewBox="0 0 64 64"
      className={`animate-sail-sway ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <ellipse cx="32" cy="48" rx="22" ry="6" fill="#0a2a36" opacity="0.35" />
      <path
        d="M12 42c4 6 36 6 40 0-2-8-8-14-20-14S14 34 12 42z"
        fill="#2b6f9c"
        stroke="#1a3a52"
        strokeWidth="1.5"
      />
      <path d="M30 14v26" stroke="#f0f4f8" strokeWidth="2" />
      <path d="M32 16l14 10H32V16z" fill="#c23b3b" />
      <path d="M30 20l-10 8h10V20z" fill="#e8f4f0" opacity="0.95" />
      <circle cx="32" cy="12" r="2" fill="#c9a227" />
    </svg>
  );
}

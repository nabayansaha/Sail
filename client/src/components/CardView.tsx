import type { Card } from '@sail/shared';
import { symbolLabel } from '@sail/shared';

const SUIT_THEME: Record<
  Card['suit'],
  { accent: string; deep: string; mid: string; label: string }
> = {
  crimson: {
    accent: '#e85d4c',
    deep: '#2a1014',
    mid: '#5c1e28',
    label: 'Crimson',
  },
  azure: {
    accent: '#4aa3e0',
    deep: '#0c1e30',
    mid: '#164862',
    label: 'Azure',
  },
  gold: {
    accent: '#d4a017',
    deep: '#241a08',
    mid: '#5c4510',
    label: 'Gold',
  },
};

type CardSize = 'sm' | 'md' | 'lg';

const CARD_SIZES: Record<CardSize, { w: number; h: number }> = {
  sm: { w: 72, h: 108 },
  md: { w: 100, h: 150 },
  lg: { w: 120, h: 180 },
};

interface Props {
  card: Card;
  disabled?: boolean;
  selected?: boolean;
  /** Received via Calico Jack peek — stays vivid even while waiting */
  peeked?: boolean;
  onClick?: () => void;
  /** @deprecated prefer size — maps to sm */
  compact?: boolean;
  size?: CardSize;
}

export function CardView({
  card,
  disabled,
  selected,
  peeked,
  onClick,
  compact,
  size,
}: Props) {
  const theme = SUIT_THEME[card.suit];
  const resolved: CardSize = size ?? (compact ? 'sm' : 'lg');
  const { w, h } = CARD_SIZES[resolved];
  const muted = Boolean(disabled) && !peeked;

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      aria-label={`${theme.label} ${card.value}, ${card.symbol}${peeked ? ', received in exchange' : ''}`}
      className={`
        relative overflow-hidden rounded-xl transition
        ${muted ? 'opacity-40 grayscale cursor-not-allowed' : ''}
        ${disabled && peeked ? 'cursor-not-allowed' : ''}
        ${!disabled ? 'hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]' : ''}
        ${selected || peeked ? 'ring-2 ring-[var(--color-brass)] -translate-y-2' : ''}
      `}
      style={{
        width: w,
        height: h,
        border: `2px solid ${peeked ? 'var(--color-brass)' : theme.accent}`,
        boxShadow:
          selected || peeked
            ? `0 0 0 1px var(--color-brass), 0 8px 24px rgba(201,162,39,0.35)`
            : `0 4px 14px rgba(0,0,0,0.35)`,
      }}
    >
      <svg viewBox="0 0 108 160" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`bg-${card.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.mid} />
            <stop offset="55%" stopColor={theme.deep} />
            <stop offset="100%" stopColor="#061018" />
          </linearGradient>
          <radialGradient id={`glow-${card.id}`} cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`frame-${card.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f0e6c8" stopOpacity="0.55" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <rect width="108" height="160" rx="12" fill={`url(#bg-${card.id})`} />
        <rect width="108" height="160" rx="12" fill={`url(#glow-${card.id})`} />

        {/* Ornate inner frame */}
        <rect
          x="6"
          y="6"
          width="96"
          height="148"
          rx="9"
          fill="none"
          stroke={`url(#frame-${card.id})`}
          strokeWidth="1.5"
          opacity="0.85"
        />
        <rect
          x="11"
          y="11"
          width="86"
          height="138"
          rx="7"
          fill="none"
          stroke={theme.accent}
          strokeWidth="0.6"
          opacity="0.35"
        />

        {/* Wave / suit motif background */}
        <SuitBackdrop suit={card.suit} accent={theme.accent} />

        {/* Corner values */}
        <text
          x="18"
          y="28"
          fill={theme.accent}
          fontSize="18"
          fontWeight="700"
          fontFamily="Fraunces, Georgia, serif"
        >
          {card.value}
        </text>
        <text
          x="90"
          y="148"
          fill={theme.accent}
          fontSize="18"
          fontWeight="700"
          fontFamily="Fraunces, Georgia, serif"
          textAnchor="middle"
          transform="rotate(180 90 140)"
        >
          {card.value}
        </text>

        {/* Center art */}
        <g transform="translate(54, 78)">
          <CardSymbolArt symbol={card.symbol} accent={theme.accent} />
        </g>

        <text
          x="54"
          y="128"
          textAnchor="middle"
          fill="#d8f0ea"
          fontSize="9"
          fontWeight="600"
          letterSpacing="0.18em"
          opacity="0.85"
        >
          {symbolLabel(card.symbol).toUpperCase()}
        </text>
      </svg>
      {peeked && (
        <span className="absolute inset-x-0 bottom-0 bg-[var(--color-brass)] py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-[var(--color-sea-950)]">
          Received
        </span>
      )}
    </button>
  );
}

function SuitBackdrop({ suit, accent }: { suit: Card['suit']; accent: string }) {
  if (suit === 'crimson') {
    return (
      <g opacity="0.2">
        <path d="M20 40 Q54 20 88 40" stroke={accent} fill="none" strokeWidth="1.2" />
        <path d="M16 50 Q54 28 92 50" stroke={accent} fill="none" strokeWidth="1" />
        <circle cx="54" cy="95" r="34" fill={accent} opacity="0.08" />
      </g>
    );
  }
  if (suit === 'azure') {
    return (
      <g opacity="0.22">
        <path d="M10 55 Q30 45 50 55 T90 55" stroke={accent} fill="none" strokeWidth="1.2" />
        <path d="M10 65 Q30 55 50 65 T90 65" stroke={accent} fill="none" strokeWidth="1" />
        <path d="M10 75 Q30 65 50 75 T90 75" stroke={accent} fill="none" strokeWidth="0.8" />
      </g>
    );
  }
  return (
    <g opacity="0.2">
      <circle cx="54" cy="70" r="28" fill="none" stroke={accent} strokeWidth="1" />
      <circle cx="54" cy="70" r="18" fill="none" stroke={accent} strokeWidth="0.7" />
      <path d="M54 40 L54 100 M30 70 L78 70" stroke={accent} strokeWidth="0.8" />
    </g>
  );
}

function CardSymbolArt({
  symbol,
  accent,
}: {
  symbol: Card['symbol'];
  accent: string;
}) {
  if (symbol === 'wheel') {
    return (
      <g>
        <circle r="26" fill="#0a1822" stroke={accent} strokeWidth="2.2" />
        <circle r="8" fill={accent} />
        <circle r="3.5" fill="#0a1822" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="-2"
            y="-26"
            width="4"
            height="10"
            rx="1"
            fill={accent}
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="18" fill="none" stroke="#f0e6c8" strokeWidth="1" opacity="0.5" />
      </g>
    );
  }
  if (symbol === 'cannon') {
    return (
      <g>
        <ellipse cx="0" cy="14" rx="22" ry="6" fill="#000" opacity="0.25" />
        <rect x="-22" y="-6" width="40" height="12" rx="4" fill={accent} />
        <rect x="14" y="-4" width="10" height="8" rx="2" fill="#f0e6c8" />
        <circle cx="-12" cy="12" r="5" fill="#d8f0ea" opacity="0.85" />
        <circle cx="8" cy="12" r="5" fill="#d8f0ea" opacity="0.85" />
        <path d="M-18 -10 L-8 -16 L2 -10" fill="none" stroke="#f0e6c8" strokeWidth="1.5" />
      </g>
    );
  }
  if (symbol === 'kraken') {
    return (
      <g>
        <ellipse cx="0" cy="4" rx="16" ry="12" fill={accent} />
        <circle cx="-6" cy="0" r="2.5" fill="#f0e6c8" />
        <circle cx="6" cy="0" r="2.5" fill="#f0e6c8" />
        <circle cx="-6" cy="0" r="1" fill="#061018" />
        <circle cx="6" cy="0" r="1" fill="#061018" />
        <path
          d="M-14 8 C-20 20 -22 28 -24 34"
          fill="none"
          stroke={accent}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M-4 12 C-6 22 -4 30 -2 36"
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M6 12 C8 22 6 30 4 36"
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M14 8 C20 20 22 28 24 34"
          fill="none"
          stroke={accent}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
    );
  }
  // mermaid / whale tail
  return (
    <g>
      <path
        d="M0 -22 C14 -10 16 6 8 18 C4 12 -4 12 -8 18 C-16 6 -14 -10 0 -22 Z"
        fill={accent}
      />
      <path
        d="M-10 16 C-2 28 2 28 10 16"
        fill="none"
        stroke="#f0e6c8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="0" cy="-6" r="3" fill="#0a1822" opacity="0.35" />
      <path d="M-18 22 Q0 10 18 22" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.6" />
    </g>
  );
}

import type { PirateDefinition } from '@sail/shared';

interface Props {
  pirate: PirateDefinition;
  selected?: boolean;
  taken?: boolean;
  onClick?: () => void;
}

const THEMES: Record<
  string,
  { skin: string; hair: string; cloth: string; accent: string; accent2: string }
> = {
  'anne-bonny': {
    skin: '#c48a6a',
    hair: '#1a1a1a',
    cloth: '#2a6a58',
    accent: '#c23b3b',
    accent2: '#d4a017',
  },
  'mary-read': {
    skin: '#8b5a3c',
    hair: '#2d4a3e',
    cloth: '#c9a227',
    accent: '#c23b3b',
    accent2: '#3a7a9a',
  },
  blackbeard: {
    skin: '#b88968',
    hair: '#2a2a2a',
    cloth: '#8a2a2a',
    accent: '#e07030',
    accent2: '#3a8a4a',
  },
  'calico-jack': {
    skin: '#c49a78',
    hair: '#c45a20',
    cloth: '#e8e0d0',
    accent: '#c23b3b',
    accent2: '#2a4a6a',
  },
  'zheng-yi-sao': {
    skin: '#a87850',
    hair: '#1a1a1a',
    cloth: '#1a4a3a',
    accent: '#c23b3b',
    accent2: '#d4a017',
  },
  'grace-omalley': {
    skin: '#c49a7a',
    hair: '#3a2a18',
    cloth: '#2a5a48',
    accent: '#c23b3b',
    accent2: '#7ec8c4',
  },
};

/** Compact in-game plaque — portrait + name + ability reminder */
export function PirateBadge({
  pirate,
  label,
}: {
  pirate: PirateDefinition;
  label?: string;
}) {
  const theme = THEMES[pirate.id] ?? THEMES['anne-bonny']!;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-sea-500)]/35 bg-[var(--color-sea-900)]/90 px-2 py-1.5">
      <svg
        viewBox="0 0 64 64"
        className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--color-brass)]/40"
        aria-hidden
      >
        <circle cx="32" cy="32" r="32" fill="#1a3a34" />
        <g transform="translate(32, 36) scale(0.72)">
          <PiratePortrait id={pirate.id} theme={theme} />
        </g>
      </svg>
      <div className="min-w-0">
        {label && (
          <p className="text-[9px] uppercase tracking-wider text-[var(--color-sea-300)]">
            {label}
          </p>
        )}
        <p className="truncate font-display text-sm font-semibold text-[var(--color-foam)]">
          {pirate.name}
        </p>
        <p className="truncate text-[10px] leading-snug text-[var(--color-ink)]/65">
          {shortAbility(pirate)}
        </p>
      </div>
    </div>
  );
}

export function PirateCard({ pirate, selected, taken, onClick }: Props) {
  const theme = THEMES[pirate.id] ?? THEMES['anne-bonny']!;

  return (
    <button
      type="button"
      disabled={taken}
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl text-left transition
        ${selected ? 'ring-2 ring-[var(--color-brass)] scale-[1.02]' : 'ring-1 ring-black/10'}
        ${taken ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl'}
      `}
    >
      <svg viewBox="0 0 200 280" className="block h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id={`sky-${pirate.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fc9b8" />
            <stop offset="55%" stopColor="#7eb8a8" />
            <stop offset="100%" stopColor="#5a9a8a" />
          </linearGradient>
          <pattern id={`grain-${pirate.id}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#2a4a42" opacity="0.12" />
            <circle cx="3" cy="3" r="0.5" fill="#e8f4f0" opacity="0.08" />
          </pattern>
          <filter id={`soft-${pirate.id}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0" />
          </filter>
        </defs>

        {/* Card body */}
        <rect width="200" height="280" rx="16" fill={`url(#sky-${pirate.id})`} />
        <rect width="200" height="280" rx="16" fill={`url(#grain-${pirate.id})`} />

        {/* Ship rigging silhouette (background) */}
        <g opacity="0.22" fill="#3a4a40">
          <rect x="20" y="40" width="3" height="160" />
          <rect x="170" y="30" width="3" height="170" />
          <path d="M22 60 L100 90 L172 50" fill="none" stroke="#3a4a40" strokeWidth="2" />
          <path d="M22 100 L100 70 L172 110" fill="none" stroke="#3a4a40" strokeWidth="1.5" />
          <path d="M22 140 L172 140" fill="none" stroke="#3a4a40" strokeWidth="1" />
          <path d="M100 40 V200" stroke="#3a4a40" strokeWidth="2.5" />
          <path d="M100 55 L145 100 H100 Z" fill="#3a4a40" opacity="0.5" />
          <path d="M100 80 L60 120 H100 Z" fill="#3a4a40" opacity="0.4" />
        </g>

        {/* Portrait */}
        <g transform="translate(100, 128)">
          <PiratePortrait id={pirate.id} theme={theme} />
        </g>

        {/* Name plate */}
        <rect x="16" y="8" width="168" height="28" rx="8" fill="#1a3a34" opacity="0.55" />
        <text
          x="100"
          y="27"
          textAnchor="middle"
          fill="#f2fff8"
          fontSize="13"
          fontWeight="700"
          fontFamily="Fraunces, Georgia, serif"
        >
          {pirate.name}
        </text>

        {/* Ability banner (footer like the physical cards) */}
        <rect x="18" y="218" width="164" height="48" rx="8" fill="#f4f0e4" />
        <rect x="18" y="218" width="164" height="48" rx="8" fill="none" stroke="#c9b896" strokeWidth="1" />
        <AbilityIcons pirate={pirate} />
        <text
          x="100"
          y="258"
          textAnchor="middle"
          fill="#2a3a36"
          fontSize="7.5"
          fontFamily="Source Sans 3, sans-serif"
        >
          {shortAbility(pirate)}
        </text>
      </svg>

      {selected && (
        <span className="absolute right-2 top-2 rounded-full bg-[var(--color-brass)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-sea-950)]">
          Selected
        </span>
      )}
      {taken && (
        <span className="absolute inset-x-0 bottom-14 text-center text-xs font-semibold uppercase tracking-wider text-[#1a3a34]">
          Taken
        </span>
      )}
    </button>
  );
}

function shortAbility(p: PirateDefinition): string {
  if (p.cannonFlips > 1) return 'Cannon+Cannon → flip 2';
  if (p.canIgnoreKrakenHelmDamage) return 'Ignore 1× Wheel+Kraken dmg';
  if (p.damageMitigationPerRound > 0) return 'Ignore 1 damage / round';
  if (p.peekExchange) return 'Peek at exchanged card';
  if (p.doubleMermaidMove) return 'Mermaid+Mermaid → move 2';
  if (p.canChooseStraightOnHelm) return 'Wheel+Wheel → may go straight';
  return p.description.slice(0, 36);
}

function AbilityIcons({ pirate }: { pirate: PirateDefinition }) {
  // Icon language inspired by the physical banners — original glyphs only
  if (pirate.cannonFlips > 1) {
    return (
      <g transform="translate(100, 236)">
        <CannonStack />
        <text x="18" y="4" fill="#2a3a36" fontSize="11" fontWeight="700">
          ×2
        </text>
      </g>
    );
  }
  if (pirate.canIgnoreKrakenHelmDamage) {
    return (
      <g transform="translate(70, 236)">
        <HelmIcon />
        <text x="16" y="4" fill="#2a3a36" fontSize="12" fontWeight="700">
          +
        </text>
        <g transform="translate(28, 0)">
          <KrakenIcon />
        </g>
        <text x="48" y="4" fill="#2a3a36" fontSize="10">
          ⇢ shield
        </text>
      </g>
    );
  }
  if (pirate.damageMitigationPerRound > 0) {
    return (
      <g transform="translate(85, 236)">
        <ShieldIcon />
        <text x="16" y="4" fill="#2a3a36" fontSize="10">
          −1 dmg
        </text>
      </g>
    );
  }
  if (pirate.peekExchange) {
    return (
      <g transform="translate(78, 236)">
        <SwapIcon />
        <text x="20" y="4" fill="#2a3a36" fontSize="10">
          peek
        </text>
      </g>
    );
  }
  if (pirate.doubleMermaidMove) {
    return (
      <g transform="translate(72, 236)">
        <MermaidIcon />
        <ShipGrid move="straight2" />
      </g>
    );
  }
  if (pirate.canChooseStraightOnHelm) {
    return (
      <g transform="translate(72, 236)">
        <HelmIcon />
        <ShipGrid move="straight" />
      </g>
    );
  }
  return null;
}

function PiratePortrait({
  id,
  theme,
}: {
  id: string;
  theme: { skin: string; hair: string; cloth: string; accent: string; accent2: string };
}) {
  // Stylized original portraits — flat, textured board-game look
  switch (id) {
    case 'blackbeard':
      return (
        <g>
          <ellipse cx="0" cy="48" rx="46" ry="28" fill={theme.cloth} />
          <circle cx="0" cy="0" r="28" fill={theme.skin} />
          <path d="M-26 -8 Q0 -38 26 -8 L22 10 Q0 18 -22 10 Z" fill={theme.accent} />
          <path d="M-18 18 Q0 42 18 18 Q12 34 0 38 Q-12 34 -18 18" fill={theme.hair} />
          <circle cx="-9" cy="-2" r="2.5" fill="#1a1a1a" />
          <circle cx="9" cy="-2" r="2.5" fill="#1a1a1a" />
          <path d="M-6 8 Q0 12 6 8" fill="none" stroke="#5a3a28" strokeWidth="1.5" />
          {/* parrot */}
          <g transform="translate(30, -10)">
            <ellipse cx="0" cy="4" rx="7" ry="10" fill={theme.accent2} />
            <circle cx="2" cy="-4" r="4" fill={theme.accent2} />
            <path d="M5 -4 L11 -2 L5 0 Z" fill={theme.accent} />
          </g>
        </g>
      );
    case 'mary-read':
      return (
        <g>
          <path d="M-40 55 L-28 10 Q0 -5 28 10 L40 55 Z" fill={theme.cloth} />
          <path d="M-20 20 L0 50 L20 20" fill={theme.accent} opacity="0.85" />
          <circle cx="0" cy="-2" r="26" fill={theme.skin} />
          <path d="M-28 -6 Q0 -36 28 -6 L24 8 Q0 2 -24 8 Z" fill={theme.hair} />
          <circle cx="-8" cy="-4" r="2.2" fill="#1a1a1a" />
          <circle cx="8" cy="-4" r="2.2" fill="#1a1a1a" />
          <circle cx="-18" cy="4" r="3" fill={theme.accent2} />
          {/* scimitar */}
          <path d="M22 10 Q48 0 52 28" fill="none" stroke="#c0c8d0" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 10 L18 16" stroke={theme.accent} strokeWidth="3" />
        </g>
      );
    case 'calico-jack':
      return (
        <g>
          <ellipse cx="0" cy="50" rx="48" ry="30" fill="#3a4a6a" />
          <path d="M-30 20 H30 V55 Q0 62 -30 55 Z" fill={theme.cloth} />
          <path d="M-28 28 H28 M-28 36 H28 M-28 44 H28" stroke={theme.accent2} strokeWidth="2" opacity="0.5" />
          <circle cx="0" cy="0" r="28" fill={theme.skin} />
          <path d="M-26 -10 Q0 -34 26 -10" fill={theme.accent} />
          <path d="M-20 16 Q0 44 20 16 Q14 36 0 40 Q-14 36 -20 16" fill={theme.hair} />
          <circle cx="-9" cy="-2" r="2.5" fill="#1a1a1a" />
          <circle cx="9" cy="-2" r="2.5" fill="#1a1a1a" />
          {/* mug */}
          <g transform="translate(32, 18)">
            <rect x="-6" y="-4" width="12" height="14" rx="2" fill="#8a5a30" />
            <path d="M6 0 Q12 2 6 8" fill="none" stroke="#8a5a30" strokeWidth="2" />
          </g>
        </g>
      );
    case 'zheng-yi-sao':
      return (
        <g>
          <path d="M-36 58 Q0 40 36 58 L28 12 Q0 0 -28 12 Z" fill={theme.cloth} />
          <path d="M-30 30 Q0 55 30 30" fill={theme.accent} />
          <circle cx="0" cy="-4" r="26" fill={theme.skin} />
          <path
            d="M-30 -8 Q-20 -40 0 -36 Q20 -40 30 -8 Q20 20 0 24 Q-20 20 -30 -8"
            fill={theme.hair}
          />
          <circle cx="-8" cy="-6" r="2.2" fill="#1a1a1a" />
          <circle cx="8" cy="-6" r="2.2" fill="#1a1a1a" />
          <path d="M-4 4 Q0 8 4 4" fill="none" stroke="#5a3a28" strokeWidth="1.3" />
          <circle cx="-16" cy="2" r="2.5" fill={theme.accent2} />
        </g>
      );
    case 'grace-omalley':
      return (
        <g>
          <path d="M-38 56 Q0 36 38 56 L30 8 Q0 -6 -30 8 Z" fill={theme.cloth} />
          <circle cx="0" cy="-6" r="26" fill={theme.skin} />
          <path d="M-28 -10 Q0 -40 28 -10 L22 12 Q0 6 -22 12 Z" fill={theme.hair} />
          <path d="M-24 0 Q0 20 24 0" fill={theme.hair} opacity="0.85" />
          <circle cx="-8" cy="-8" r="2.2" fill="#1a1a1a" />
          <circle cx="8" cy="-8" r="2.2" fill="#1a1a1a" />
          {/* helm badge */}
          <g transform="translate(0, 28)">
            <circle r="8" fill="none" stroke={theme.accent2} strokeWidth="2" />
            <circle r="2" fill={theme.accent2} />
          </g>
        </g>
      );
    default: // anne-bonny
      return (
        <g>
          <path d="M-38 56 Q0 38 38 56 L30 10 Q0 -4 -30 10 Z" fill={theme.cloth} />
          <path d="M-22 24 L0 48 L22 24" fill={theme.accent} opacity="0.9" />
          <circle cx="0" cy="-4" r="26" fill={theme.skin} />
          <path
            d="M-30 -6 Q-10 -40 10 -36 Q30 -40 30 -4 Q22 22 0 26 Q-22 22 -30 -6"
            fill={theme.hair}
          />
          <circle cx="-8" cy="-6" r="2.2" fill="#1a1a1a" />
          <circle cx="8" cy="-6" r="2.2" fill="#1a1a1a" />
          <path d="M28 8 L42 28" stroke="#c0c8d0" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="-18" cy="2" r="2.8" fill={theme.accent2} />
        </g>
      );
  }
}

function HelmIcon() {
  return (
    <g>
      <circle r="7" fill="none" stroke="#2a3a36" strokeWidth="1.5" />
      <circle r="2" fill="#2a3a36" />
    </g>
  );
}

function KrakenIcon() {
  return (
    <g>
      <circle cy="-2" r="4" fill="#c23b3b" />
      <path d="M-3 1 C-5 8 -6 10 -7 12 M0 2 V12 M3 1 C5 8 6 10 7 12" stroke="#c23b3b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

function MermaidIcon() {
  return (
    <path d="M0 -8 C6 -2 6 6 2 10 C0 6 -2 6 -2 10 C-6 6 -6 -2 0 -8 Z" fill="#2a6a9a" />
  );
}

function CannonStack() {
  return (
    <g>
      <rect x="-14" y="-6" width="16" height="10" rx="2" fill="#2a3a36" />
      <rect x="-10" y="-10" width="16" height="10" rx="2" fill="#4a5a56" />
    </g>
  );
}

function ShieldIcon() {
  return <path d="M0 -8 L8 -4 V2 Q0 10 -8 2 V-4 Z" fill="#2a6a58" />;
}

function SwapIcon() {
  return (
    <g stroke="#2a3a36" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M-8 -3 H6" />
      <path d="M2 -7 L8 -3 L2 1" />
      <path d="M8 5 H-6" />
      <path d="M-2 1 L-8 5 L-2 9" />
    </g>
  );
}

function ShipGrid({ move }: { move: 'straight' | 'straight2' }) {
  return (
    <g transform="translate(22, -6)">
      <rect width="28" height="18" rx="2" fill="none" stroke="#2a3a36" strokeWidth="1" />
      <path d="M9 0 V18 M19 0 V18 M0 6 H28 M0 12 H28" stroke="#2a3a36" strokeWidth="0.5" opacity="0.4" />
      <path d="M6 14 L14 6" stroke="#c23b3b" strokeWidth="1.8" strokeLinecap="round" />
      {move === 'straight2' && (
        <path d="M14 6 L22 6" stroke="#c23b3b" strokeWidth="1.8" strokeLinecap="round" />
      )}
      <circle cx="6" cy="14" r="1.8" fill="#2a3a36" />
    </g>
  );
}

interface Props {
  damaged?: boolean;
  className?: string;
}

export function KrakenSvg({ damaged = false, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={`animate-kraken-pulse ${className}`}
      aria-hidden
    >
      <ellipse cx="40" cy="36" rx="18" ry="14" fill={damaged ? '#6b2a3a' : '#1a5c5a'} />
      <circle cx="33" cy="32" r="3" fill="#e8f1f4" />
      <circle cx="47" cy="32" r="3" fill="#e8f1f4" />
      <circle cx="33" cy="32" r="1.2" fill="#06141f" />
      <circle cx="47" cy="32" r="1.2" fill="#06141f" />
      <path
        d="M22 40c-6 10-12 18-14 26 8-4 14-10 18-16"
        fill="none"
        stroke={damaged ? '#e85d4c' : '#2a8a80'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M58 40c6 10 12 18 14 26-8-4-14-10-18-16"
        fill="none"
        stroke={damaged ? '#e85d4c' : '#2a8a80'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M30 48c-2 12 0 20 2 26 4-8 6-16 4-24"
        fill="none"
        stroke="#164862"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M50 48c2 12 0 20-2 26-4-8-6-16-4-24"
        fill="none"
        stroke="#164862"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

import type { BoardCell, Position, ShipState } from '@sail/shared';
import { useMemo } from 'react';
import { ShipSvg } from './ShipSvg';

interface Props {
  board: BoardCell[];
  cols: number;
  rows: number;
  ship: ShipState;
  storms: number[];
  start: Position;
  end: Position;
  /** Seat 0 sits on the A-side; seat 1 on the G-side (opposite). */
  viewerSeat: 0 | 1;
  youName: string;
  opponentName: string;
  compact?: boolean;
}

/**
 * Seat 0: Start→End left-to-right, A-side (you) at bottom.
 * Seat 1: mirrored — Start→End right-to-left, G-side (you) at bottom.
 */
export function OceanBoard({
  board,
  cols,
  rows,
  ship,
  storms,
  viewerSeat,
  youName,
  opponentName,
  compact = false,
}: Props) {
  const byKey = useMemo(
    () => new Map(board.map((c) => [`${c.position.col},${c.position.row}`, c])),
    [board],
  );

  const mirrored = viewerSeat === 1;
  const yourLetter = viewerSeat === 0 ? 'A' : 'G';
  const theirLetter = viewerSeat === 0 ? 'G' : 'A';

  const cellW = compact ? 44 : 54;
  const cellH = compact ? 28 : 38;
  const shear = mirrored ? (compact ? -14 : -18) : compact ? 14 : 18;
  const padL = compact ? 28 : 40;
  const padR = compact ? 28 : 40;
  const padT = compact ? 22 : 36;
  const padB = compact ? 22 : 36;

  const boardW = padL + rows * cellW + Math.abs(shear) + padR;
  const boardH = padT + cols * cellH + padB;

  /** Map model col (0=A … 6=G) to visual row index from top. */
  function visualColIndex(col: number): number {
    // You always sit at the bottom of the screen
    if (!mirrored) {
      // A at bottom → col 0 has highest visual index
      return cols - 1 - col;
    }
    // G at bottom → col 6 has highest visual index
    return col;
  }

  /** Map model voyage row to visual X (Start→End direction for this viewer). */
  function visualRowIndex(row: number): number {
    if (!mirrored) return row - 1; // Start left
    return rows - row; // Start right
  }

  function cellPoly(col: number, row: number) {
    const vi = visualColIndex(col);
    const hi = visualRowIndex(row);
    const yBase = padT + vi * cellH;
    const stagger = vi % 2 === 1 ? shear * 0.35 : 0;
    const xBase = padL + hi * cellW + stagger;

    const x0 = xBase + Math.max(0, shear);
    const y0 = yBase;
    const x1 = xBase + cellW + Math.max(0, shear);
    const y1 = yBase;
    const x2 = xBase + cellW + Math.min(0, shear);
    const y2 = yBase + cellH;
    const x3 = xBase + Math.min(0, shear);
    const y3 = yBase + cellH;

    // For negative shear, keep parallelogram correct
    const pts = mirrored
      ? `${xBase},${y0} ${xBase + cellW},${y1} ${xBase + cellW + shear},${y2} ${xBase + shear},${y3}`
      : `${x0},${y0} ${x1},${y1} ${x2},${y2} ${x3},${y3}`;

    const xs = pts.split(' ').map((p) => Number(p.split(',')[0]));
    const ys = pts.split(' ').map((p) => Number(p.split(',')[1]));
    const cx = xs.reduce((a, b) => a + b, 0) / 4;
    const cy = ys.reduce((a, b) => a + b, 0) / 4;
    return { points: pts, cx, cy };
  }

  // Ship facing relative to viewer: "forward" toward End
  const viewFacing: ShipState['facing'] = (() => {
    if (ship.facing === 'forward') return 'forward';
    if (!mirrored) return ship.facing;
    // Mirror left/right for opposite seat
    return ship.facing === 'left' ? 'right' : 'left';
  })();

  const voyageHint = mirrored ? 'End ← Start  (your view)' : 'Start → End  (your view)';

  return (
    <div className="overflow-hidden rounded-xl border border-[#7eb8b0]/50 bg-[#d8efe9] p-1.5 shadow-inner">
      <div className="mb-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-1 text-[10px] text-[#2a5a62]">
        <span className="font-semibold uppercase tracking-wider">Ocean</span>
        <span>
          {String.fromCharCode(65 + ship.position.col)}
          {ship.position.row}
          <span className="mx-1.5 opacity-40">·</span>
          {voyageHint}
        </span>
        <span>
          <span className="rounded bg-[#1a5a52] px-1.5 py-px font-semibold text-[#e8fff8]">
            {mirrored ? 'END' : 'START'}
          </span>
          <span className="mx-1 opacity-50">···</span>
          You=<strong>{yourLetter}</strong> · Partner=<strong>{theirLetter}</strong>
          <span className="mx-1 opacity-50">···</span>
          <span className="rounded bg-[#1a5a52] px-1.5 py-px font-semibold text-[#e8fff8]">
            {mirrored ? 'START' : 'END'}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-xl">
        <svg
          viewBox={`0 0 ${boardW} ${boardH}`}
          className="h-auto min-w-full"
          style={{ minWidth: Math.min(boardW, 920) }}
          role="img"
          aria-label={`Ocean board from ${youName}'s seat`}
        >
          <defs>
            <linearGradient
              id="sea-wash"
              x1={mirrored ? '1' : '0'}
              y1="0"
              x2={mirrored ? '0' : '1'}
              y2="0"
            >
              <stop offset="0%" stopColor="#b9e4de" />
              <stop offset="35%" stopColor="#e8f6c8" />
              <stop offset="70%" stopColor="#c5ebe4" />
              <stop offset="100%" stopColor="#7aa8b8" />
            </linearGradient>
            <radialGradient id="sun-glow" cx="45%" cy="50%" r="42%">
              <stop offset="0%" stopColor="#fff6c8" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#d5f0a8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#b9e4de" stopOpacity="0" />
            </radialGradient>
            <pattern id="ripples" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="18" fill="none" stroke="#5a9a98" strokeWidth="0.6" opacity="0.18" />
              <circle cx="40" cy="40" r="30" fill="none" stroke="#5a9a98" strokeWidth="0.5" opacity="0.12" />
              <circle cx="40" cy="40" r="42" fill="none" stroke="#5a9a98" strokeWidth="0.4" opacity="0.08" />
            </pattern>
            <linearGradient
              id="end-deep"
              x1={mirrored ? '1' : '0'}
              y1="0"
              x2={mirrored ? '0' : '1'}
              y2="0"
            >
              <stop offset="0%" stopColor="#3a6a7a" stopOpacity="0" />
              <stop offset="40%" stopColor="#1e3a4a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#122830" />
            </linearGradient>
          </defs>

          <rect width={boardW} height={boardH} rx="10" fill="url(#sea-wash)" />
          <rect width={boardW} height={boardH} rx="10" fill="url(#sun-glow)" />
          <rect width={boardW} height={boardH} rx="10" fill="url(#ripples)" />

          {/* End zone */}
          <rect
            x={
              mirrored
                ? 0
                : padL + (rows - 2.2) * cellW
            }
            y="0"
            width={padR + 2.5 * cellW}
            height={boardH}
            fill="url(#end-deep)"
          />

          {/* Opponent side band (top) */}
          <rect
            x="0"
            y="0"
            width={boardW}
            height={padT - 4}
            fill="#2a5a62"
            opacity="0.12"
          />
          <text
            x={boardW / 2}
            y={compact ? 12 : 16}
            textAnchor="middle"
            fill="#1a4a52"
            fontSize={compact ? 9 : 11}
            fontWeight="700"
            fontFamily="Source Sans 3, sans-serif"
          >
            {opponentName || 'Partner'} · {theirLetter}-side
          </text>

          {/* Your side band (bottom) */}
          <rect
            x="0"
            y={boardH - padB + 4}
            width={boardW}
            height={padB - 4}
            fill="#1a5a52"
            opacity="0.18"
          />
          <text
            x={boardW / 2}
            y={boardH - (compact ? 7 : 10)}
            textAnchor="middle"
            fill="#0a3a34"
            fontSize={compact ? 9 : 11}
            fontWeight="700"
            fontFamily="Source Sans 3, sans-serif"
          >
            You ({youName}) · {yourLetter}-side
          </text>

          {Array.from({ length: rows }, (_, ri) => {
            const row = ri + 1;
            return Array.from({ length: cols }, (_, col) => {
              const cell = byKey.get(`${col},${row}`);
              const { points, cx, cy } = cellPoly(col, row);
              const isShip =
                ship.position.col === col && ship.position.row === row;
              const isStorm = storms.includes(row);
              const nearEnd = row >= rows - 1;

              return (
                <g key={`${col}-${row}`}>
                  <polygon
                    points={points}
                    fill={cellFill(cell?.type, nearEnd)}
                    stroke={isStorm ? '#3a5a62' : '#ffffff'}
                    strokeWidth={isStorm ? 1.6 : 1.15}
                    opacity={0.92}
                  />
                  {isStorm && (
                    <polygon
                      points={points}
                      fill="none"
                      stroke="#2a4a52"
                      strokeWidth="1"
                      strokeDasharray="3 2"
                      opacity="0.7"
                    />
                  )}

                  <text
                    x={cx}
                    y={cy + (cell?.type === 'empty' ? 3 : 12)}
                    textAnchor="middle"
                    fill={nearEnd ? '#c8e0e8' : '#3a5a62'}
                    fontSize="8"
                    fontFamily="Source Sans 3, sans-serif"
                    fontWeight="600"
                    opacity="0.75"
                  >
                    {String.fromCharCode(65 + col)}
                    {row}
                  </text>

                  {cell?.type === 'island' && <RockToken x={cx} y={cy - 4} />}
                  {cell?.type === 'kraken' && <WaveThreat x={cx} y={cy - 4} />}
                  {cell?.type === 'start' && (
                    <text
                      x={cx}
                      y={cy - 6}
                      textAnchor="middle"
                      fill="#1a4a52"
                      fontSize="7"
                      fontWeight="700"
                    >
                      START
                    </text>
                  )}
                  {cell?.type === 'end' && (
                    <g transform={`translate(${cx}, ${cy - 2})`}>
                      <AnchorIcon />
                      <text
                        y="14"
                        textAnchor="middle"
                        fill="#e8f4f8"
                        fontSize="7"
                        fontWeight="700"
                      >
                        END
                      </text>
                    </g>
                  )}

                  {isShip && (
                    <foreignObject x={cx - 16} y={cy - 20} width="32" height="32">
                      <div className="animate-bob flex h-full w-full items-center justify-center">
                        <ShipSvg
                          facing={viewFacing}
                          mirrored={mirrored}
                          className="h-7 w-7"
                        />
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            });
          })}
        </svg>
      </div>
    </div>
  );
}

function cellFill(type: BoardCell['type'] | undefined, nearEnd: boolean): string {
  if (type === 'island') return '#c4a574';
  if (type === 'kraken') return '#9ec9c4';
  if (type === 'start') return '#a8ddd4';
  if (type === 'end') return '#2a4a58';
  if (nearEnd) return '#3d6570';
  return '#c8ebe4';
}

function RockToken({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 9}, ${y - 8})`}>
      <path d="M2 14 L6 4 L12 8 L16 3 L18 14 Z" fill="#e0893a" stroke="#b86520" strokeWidth="0.8" />
      <path d="M4 14 L8 7 L11 11 L14 6 L16 14" fill="none" stroke="#f0b060" strokeWidth="0.7" />
    </g>
  );
}

function WaveThreat({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 10}, ${y - 8})`}>
      <path
        d="M2 12 Q6 2 10 10 Q14 2 18 12"
        fill="#d64545"
        stroke="#9a2828"
        strokeWidth="0.8"
      />
      <path d="M4 12 Q10 6 16 12" fill="none" stroke="#f08080" strokeWidth="1" />
    </g>
  );
}

function AnchorIcon() {
  return (
    <g>
      <circle cx="0" cy="-4" r="2.2" fill="none" stroke="#d8eef4" strokeWidth="1.2" />
      <path
        d="M0 -2 V8 M-5 5 Q0 10 5 5"
        fill="none"
        stroke="#d8eef4"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M-4 1 H4" stroke="#d8eef4" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

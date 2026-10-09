import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionAid } from '../components/ActionAid';
import { CardView } from '../components/CardView';
import { KrakenBoard } from '../components/KrakenBoard';
import { OceanBoard } from '../components/OceanBoard';
import { PirateBadge } from '../components/PirateCard';
import { RoundBanner } from '../components/RoundBanner';
import { useGameStore } from '../store/gameStore';

export function GameScreen() {
  const state = useGameStore((s) => s.state);
  const playerId = useGameStore((s) => s.playerId);
  const exchangeCard = useGameStore((s) => s.exchangeCard);
  const playCard = useGameStore((s) => s.playCard);
  const error = useGameStore((s) => s.error);
  const [chooseStraight, setChooseStraight] = useState(false);
  const [ignoreKraken, setIgnoreKraken] = useState(false);
  const [peekDismissed, setPeekDismissed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const lastPeekKey = useRef('');

  const myPirate = useMemo(
    () => state?.pirates.find((p) => p.id === state.you.pirateId),
    [state],
  );
  const oppPirate = useMemo(
    () => state?.pirates.find((p) => p.id === state.opponent.pirateId),
    [state],
  );

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [state?.actionLog.length]);

  const peekKey = (state?.you.peekedCardIds ?? []).join('|');
  useEffect(() => {
    if (peekKey && peekKey !== lastPeekKey.current) {
      lastPeekKey.current = peekKey;
      setPeekDismissed(false);
    }
    if (!peekKey) {
      lastPeekKey.current = '';
      setPeekDismissed(false);
    }
  }, [peekKey]);

  if (!state) return null;

  const isExchange = state.phase === 'EXCHANGE';
  const isPlaying = state.phase === 'PLAYING';
  const myTurn = state.currentTurnPlayerId === playerId;
  const silence = isExchange || isPlaying;
  const legal = new Set(state.legalCardIds);
  const exchangeNeeded = myPirate?.exchangeCount ?? 1;
  const me = state.players.find((p) => p.playerId === playerId);
  const opponent = state.players.find((p) => p.playerId !== playerId);
  const viewerSeat = (me?.seat ?? 0) as 0 | 1;
  const peekedCards = state.you.hand.filter((c) =>
    state.you.peekedCardIds.includes(c.id),
  );
  const showPeekReveal =
    isPlaying && peekedCards.length > 0 && !peekDismissed;

  return (
    <div className="mx-auto max-w-7xl px-3 py-2 md:px-4 md:py-3">
      <RoundBanner round={state.currentRound} phase={state.phase} />

      {showPeekReveal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
          <div className="animate-fade-up w-full max-w-sm rounded-2xl border border-[var(--color-brass)]/50 bg-[var(--color-sea-900)] px-5 py-6 text-center shadow-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brass)]">
              Calico Jack — peek
            </p>
            <h2 className="mt-1 font-display text-xl text-[var(--color-foam)]">
              You received
            </h2>
            <div className="mt-4 flex justify-center gap-3">
              {peekedCards.map((card) => (
                <CardView key={card.id} card={card} size="lg" peeked />
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--color-sea-300)]">
              Partner stays blind. This card stays marked in your hand.
            </p>
            <button
              type="button"
              className="mt-5 rounded-lg bg-[var(--color-brass)] px-4 py-2 text-sm font-semibold text-[var(--color-sea-950)]"
              onClick={() => setPeekDismissed(true)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Compact status bar */}
      <header className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <h1 className="font-display text-xl font-bold text-[var(--color-foam)]">
          Sail
        </h1>
        <span className="text-[var(--color-sea-300)]">
          R{state.currentRound} · {state.scenarioName}
        </span>
        {state.players.map((p) => {
          const pirateName = state.pirates.find((x) => x.id === p.pirateId)?.name;
          return (
            <span
              key={p.playerId}
              className={`rounded-md px-2 py-0.5 text-xs ${
                state.currentTurnPlayerId === p.playerId
                  ? 'bg-[var(--color-brass)]/20 text-[var(--color-brass)]'
                  : 'text-[var(--color-ink)]/70'
              }`}
            >
              {p.displayName}
              {p.playerId === playerId ? ' (you)' : ''}
              {pirateName ? ` · ${pirateName}` : ''} · {p.tricksWon}/4
              <span className={p.connected ? ' text-emerald-400' : ' text-red-400'}>
                {' '}
                {p.connected ? '●' : '○'}
              </span>
            </span>
          );
        })}
        <span className="text-xs text-[var(--color-sea-300)]">
          Deck {state.playerDeckCount} · Discard {state.discardPile.length}
        </span>
        {silence && (
          <span className="rounded-full border border-[var(--color-brass)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brass)]">
            No talk
          </span>
        )}
      </header>

      <div className="grid items-start gap-2 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main column: board then hand — no big gap */}
        <div className="flex min-w-0 flex-col gap-2">
          <OceanBoard
            board={state.board}
            cols={state.boardCols}
            rows={state.boardRows}
            ship={state.ship}
            storms={state.storms}
            start={state.start}
            end={state.end}
            viewerSeat={viewerSeat}
            youName={me?.displayName ?? 'You'}
            opponentName={opponent?.displayName ?? 'Partner'}
            compact
          />

          <section className="rounded-xl border border-[var(--color-sea-500)]/30 bg-[var(--color-sea-900)]/50 px-3 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h3 className="font-display text-base text-[var(--color-foam)]">
                  {isExchange ? 'Exchange' : 'Your hand'}
                </h3>
                <p className="text-xs text-[var(--color-ink)]/60">
                  {isExchange
                    ? `Give ${exchangeNeeded} card${exchangeNeeded > 1 ? 's' : ''} (blind)${
                        state.you.exchangeSelectedCount >= exchangeNeeded
                          ? ' — waiting…'
                          : ''
                      }`
                    : myTurn
                      ? 'Your turn — play a legal card'
                      : 'Waiting for partner…'}
                </p>
              </div>
              {isPlaying && myTurn && (
                <div className="flex flex-wrap gap-3 text-[11px] text-[var(--color-sea-300)]">
                  {myPirate?.canChooseStraightOnHelm && (
                    <label className="flex items-center gap-1" title="If you win the trick with Wheel+Wheel">
                      <input
                        type="checkbox"
                        checked={chooseStraight}
                        onChange={(e) => setChooseStraight(e.target.checked)}
                      />
                      Straight on Wheel+Wheel
                      {state.trick.playedCards.length === 0 && (
                        <span className="text-[var(--color-ink)]/45">
                          (check before you lead)
                        </span>
                      )}
                    </label>
                  )}
                  {myPirate?.canIgnoreKrakenHelmDamage && (
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={ignoreKraken}
                        onChange={(e) => setIgnoreKraken(e.target.checked)}
                      />
                      Ignore Wheel+Kraken dmg
                    </label>
                  )}
                </div>
              )}
            </div>
            {peekedCards.length > 0 && (
              <p className="mb-1 text-[11px] text-[var(--color-brass)]">
                Brass border + “Received” = card from the exchange
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {state.you.hand.map((card) => {
                const exchangeDone =
                  state.you.exchangeSelectedCount >= exchangeNeeded;
                const disabled = isPlaying
                  ? !myTurn || !legal.has(card.id)
                  : isExchange
                    ? exchangeDone
                    : true;
                const peeked = state.you.peekedCardIds.includes(card.id);
                return (
                  <CardView
                    key={card.id}
                    card={card}
                    size="md"
                    peeked={peeked}
                    disabled={disabled}
                    onClick={() => {
                      if (isExchange) exchangeCard(card.id);
                      else if (isPlaying && myTurn)
                        playCard(card.id, {
                          chooseStraight,
                          ignoreKrakenDamage: ignoreKraken,
                        });
                    }}
                  />
                );
              })}
            </div>
          </section>

          {error && (
            <p className="text-center text-xs text-[var(--color-danger)]">{error}</p>
          )}

          <div
            ref={logRef}
            className="max-h-28 overflow-y-auto rounded-lg bg-black/20 px-2 py-1.5 text-[11px] leading-relaxed text-[var(--color-sea-300)]"
          >
            {state.actionLog.map((line, i) => {
              const isRound =
                line.startsWith('Round ') &&
                (line.includes(' ended') || line.includes(' begins'));
              return (
                <div
                  key={`${i}-${line}`}
                  className={
                    isRound
                      ? 'mt-1 font-semibold text-[var(--color-brass)]'
                      : undefined
                  }
                >
                  {line}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar — does not push the hand down */}
        <aside className="flex flex-col gap-2 lg:sticky lg:top-2">
          <div className="space-y-1.5">
            {myPirate && <PirateBadge pirate={myPirate} label="You" />}
            {oppPirate && (
              <PirateBadge
                pirate={oppPirate}
                label={opponent?.displayName ?? 'Partner'}
              />
            )}
          </div>
          <KrakenBoard
            trackerIndex={state.kraken.trackerIndex}
            damageValue={state.kraken.damageValue}
            deckCount={state.kraken.deckCount}
          />
          <div className="rounded-xl border border-[var(--color-sea-500)]/40 bg-[var(--color-sea-900)]/80 p-2">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-[var(--color-sea-300)]">
              Current trick
            </div>
            <div className="flex min-h-20 flex-wrap items-center justify-center gap-2">
              {state.trick.playedCards.length === 0 && (
                <span className="text-xs text-[var(--color-ink)]/50">
                  Waiting for lead…
                </span>
              )}
              {state.trick.playedCards.map((tc) => (
                <div key={tc.card.id} className="animate-card-play">
                  <CardView card={tc.card} compact />
                  <p className="mt-0.5 text-center text-[10px] text-[var(--color-sea-300)]">
                    {
                      state.players.find((p) => p.playerId === tc.playerId)
                        ?.displayName
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
          <ActionAid compact />
        </aside>
      </div>
    </div>
  );
}

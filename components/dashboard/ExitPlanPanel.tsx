'use client';
import { useState, useMemo } from 'react';
import { PairInfo } from '@/lib/types';
import { fmtUSD, fmtUSDFull, fmtPct, fmtNum } from '@/lib/calculations';
import { CheckCircle2, Clock, ChevronDown, ChevronUp, Zap, Target, AlertTriangle } from 'lucide-react';

interface Props {
  pairs: PairInfo[];
  walletBalance: number;
}

// ─── Calculate gradual SOL exit at a given price ──────────────────────────────
function solCloseStep(pair: PairInfo, closeSize: number, atPrice: number) {
  const shortPnL = (pair.short.entryPrice - atPrice) * closeSize;   // + if green
  const longPnL  = (atPrice - pair.long.entryPrice)  * closeSize;   // - (loss)
  return {
    shortProfit: shortPnL,
    longLoss: longPnL,
    netRealized: shortPnL + longPnL,
  };
}

// ─── DCA average entry calculator ─────────────────────────────────────────────
function calcDCAAvg(
  origSize: number,
  origEntry: number,
  dcaLevels: { price: number; size: number }[],
) {
  let totalNotional = origSize * origEntry;
  let totalSize     = origSize;
  const rows: { price: number; size: number; cumSize: number; avgEntry: number; recoverPct: number }[] = [];

  for (const lvl of dcaLevels) {
    if (lvl.size <= 0) continue;
    totalNotional += lvl.price * lvl.size;
    totalSize     += lvl.size;
    const avgEntry   = totalNotional / totalSize;
    const recoverPct = ((avgEntry - lvl.price) / lvl.price) * 100;
    rows.push({ price: lvl.price, size: lvl.size, cumSize: totalSize, avgEntry, recoverPct });
  }
  return rows;
}

export default function ExitPlanPanel({ pairs, walletBalance }: Props) {
  const solPair = pairs.find(p => p.symbol === 'SOL');
  const btcPair = pairs.find(p => p.symbol === 'BTC');

  // ── SOL close-out config ───────────────────────────────────────────────────
  const solTotalSize  = solPair?.long.size ?? 160;
  const solChunkSize  = Math.round(solTotalSize / 4); // 4 stages
  const solCurrent    = solPair?.long.currentPrice ?? 86.371;
  const solShortEntry = solPair?.short.entryPrice ?? 78.066;
  const solLongEntry  = solPair?.long.entryPrice  ?? 217.117;
  const solPctAway    = solPair ? solPair.shortPctToBreakEven : 0;
  const solIsReady    = solPair ? solPair.short.currentPrice <= solShortEntry : false;

  // SOL staged close prices (every ~5% below trigger)
  const solStagePrices = useMemo(() => {
    const base = solShortEntry;
    return [
      Math.round(base * 0.97),  // ~3% below trigger
      Math.round(base * 0.92),  // ~8%
      Math.round(base * 0.87),  // ~13%
      Math.round(base * 0.82),  // ~18%
    ];
  }, [solShortEntry]);

  // SOL staged steps with net realized per chunk
  const solSteps = useMemo(() =>
    solStagePrices.map((price, i) => {
      const step = solCloseStep(
        solPair ?? { short: { entryPrice: solShortEntry }, long: { entryPrice: solLongEntry } } as PairInfo,
        solChunkSize,
        price,
      );
      return { stage: i + 1, price, closeSize: solChunkSize, ...step };
    }),
  [solPair, solStagePrices, solChunkSize, solShortEntry, solLongEntry]);

  const solTotalRealised = solSteps.reduce((s, r) => s + r.netRealized, 0);
  const solLockedLoss    = solPair?.lockedLoss ?? 0;

  // ── BTC DCA config ─────────────────────────────────────────────────────────
  const btcLongSize  = btcPair?.long.size ?? 0.417;
  const btcLongEntry = btcPair?.long.entryPrice ?? 119633;
  const btcShortEntry = btcPair?.short.entryPrice ?? 62650;
  const btcCurrent   = btcPair?.long.currentPrice ?? 77651;
  const btcShortPct  = btcPair?.shortPctToBreakEven ?? 0;
  const btcIsReady   = btcPair ? btcPair.short.currentPrice <= btcShortEntry : false;

  // Default DCA levels: below BTC short entry in $5k steps
  const [dcaSize, setDcaSize] = useState(0.05); // BTC per level
  const defaultLevels = [
    Math.round(btcShortEntry * 0.95 / 1000) * 1000,
    Math.round(btcShortEntry * 0.88 / 1000) * 1000,
    Math.round(btcShortEntry * 0.80 / 1000) * 1000,
    Math.round(btcShortEntry * 0.72 / 1000) * 1000,
    Math.round(btcShortEntry * 0.64 / 1000) * 1000,
  ];
  const [dcaLevelInputs, setDcaLevelInputs] = useState<string[]>(
    defaultLevels.map(String),
  );

  const dcaLevels = dcaLevelInputs.map(v => ({
    price: parseFloat(v) || 0,
    size: dcaSize,
  })).filter(l => l.price > 0);

  const dcaRows = calcDCAAvg(btcLongSize, btcLongEntry, dcaLevels);

  // ── Margin per DCA level ────────────────────────────────────────────────────
  const marginPerDca = (price: number) => (price * dcaSize) / (btcPair?.long.leverage ?? 100);

  // ── Collapse state ─────────────────────────────────────────────────────────
  const [solOpen, setSolOpen] = useState(true);
  const [btcOpen, setBtcOpen] = useState(true);

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div>
        <h2 className="font-bold t-1 text-base flex items-center gap-2">
          <Target size={16} className="text-orange-400" />
          Your Staged Exit Plan
        </h2>
        <p className="text-[11px] t-3 mt-0.5">
          Phase 1: Close SOL pair gradually (short profit offsets long loss) →
          Phase 2: Close BTC short → DCA pure BTC long with <strong className="t-2">no hedge left</strong>
        </p>
      </div>

      {/* ── PHASE 1: SOL Gradual Exit ── */}
      {solPair && (
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${solIsReady ? 'rgba(34,197,94,0.4)' : 'rgba(63,63,70,0.5)'}` }}>

          <button className="w-full flex items-center gap-3 p-3 text-left"
            onClick={() => setSolOpen(v => !v)}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
              ${solIsReady ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold t-1">Close SOL Pair Gradually</span>
                {solIsReady
                  ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Zap size={9} /> TRIGGERED — execute now
                    </span>
                  : <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                      <Clock size={9} /> Waiting — SOL {fmtPct(-solPctAway)} to trigger
                    </span>
                }
              </div>
              <div className="text-[11px] t-3 mt-0.5">
                Trigger: SOL ≤ ${fmtNum(solShortEntry, 3)} (short break-even) · Now: ${fmtNum(solCurrent, 3)}
              </div>
            </div>
            {solOpen ? <ChevronUp size={14} className="t-3 flex-shrink-0" /> : <ChevronDown size={14} className="t-3 flex-shrink-0" />}
          </button>

          {solOpen && (
            <div className="px-3 pb-3 space-y-2.5">
              {/* Locked loss notice */}
              <div className="rounded-lg p-2.5 text-[11px]"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <span className="text-red-400 font-semibold">Note: </span>
                <span className="t-2">
                  SOL pair locked loss = <strong className="text-red-400">{fmtUSD(solLockedLoss)}</strong> no matter when you close.
                  The short profit at each stage partially offsets the long loss — total is the same.
                  The benefit: reduce exposure gradually and feel in control.
                </span>
              </div>

              {/* Stage table */}
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="grid grid-cols-5 gap-1 px-3 py-1.5 text-[10px] font-semibold t-3 uppercase tracking-wide"
                  style={{ background: 'var(--surface-deep)', borderBottom: '1px solid var(--border)' }}>
                  <span>Stage</span>
                  <span>SOL Price</span>
                  <span>Close</span>
                  <span className="text-emerald-500">Short +</span>
                  <span className="text-red-400">Net Step</span>
                </div>
                {solSteps.map(step => (
                  <div key={step.stage}
                    className="grid grid-cols-5 gap-1 px-3 py-2 text-[11px]"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-semibold t-1">{step.stage}</span>
                    <span className="t-2">${fmtNum(step.price, 0)}</span>
                    <span className="t-2">{step.closeSize} SOL</span>
                    <span className={step.shortProfit >= 0 ? 'text-emerald-500 font-semibold' : 'text-orange-400'}>
                      {step.shortProfit >= 0 ? '+' : ''}{fmtUSD(step.shortProfit, 0)}
                    </span>
                    <span className="text-red-400 font-semibold">{fmtUSD(step.netRealized, 0)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-5 gap-1 px-3 py-2 text-[11px] font-bold"
                  style={{ background: 'var(--surface-deep)' }}>
                  <span className="t-1 col-span-2">Total SOL loss</span>
                  <span />
                  <span />
                  <span className="text-red-500">{fmtUSD(solTotalRealised, 0)}</span>
                </div>
              </div>

              {/* After SOL closed */}
              <div className="rounded-lg p-2.5 text-[11px]"
                style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <span className="text-blue-400 font-semibold">After SOL fully closed: </span>
                <span className="t-2">
                  Only BTC pair remains. Wallet balance: ~{fmtUSD(walletBalance + solLockedLoss, 0)}.
                  Equity stays the same (~$4,271) — closures don't change equity, only realise the locked loss.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PHASE 2: BTC Short Close + DCA ── */}
      {btcPair && (
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${btcIsReady ? 'rgba(34,197,94,0.4)' : 'rgba(63,63,70,0.5)'}` }}>

          <button className="w-full flex items-center gap-3 p-3 text-left"
            onClick={() => setBtcOpen(v => !v)}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
              ${btcIsReady ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold t-1">Close ALL Shorts → DCA Pure BTC Long</span>
                {btcIsReady
                  ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Zap size={9} /> TRIGGERED
                    </span>
                  : <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                      <Clock size={9} /> BTC {fmtPct(-btcShortPct)} to trigger
                    </span>
                }
              </div>
              <div className="text-[11px] t-3 mt-0.5">
                Trigger: BTC ≤ ${btcShortEntry.toLocaleString()} (short break-even) · Now: ${btcCurrent.toLocaleString()}
              </div>
            </div>
            {btcOpen ? <ChevronUp size={14} className="t-3 flex-shrink-0" /> : <ChevronDown size={14} className="t-3 flex-shrink-0" />}
          </button>

          {btcOpen && (
            <div className="px-3 pb-3 space-y-3">
              {/* NO HEDGE banner */}
              <div className="rounded-lg p-2.5 flex items-start gap-2"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)' }}>
                <AlertTriangle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] t-2">
                  <span className="text-orange-400 font-bold">All shorts closed. No hedge remaining.</span>{' '}
                  After this phase you are 100% long BTC — pure directional exposure.
                  Only execute when TSI confirms bullish momentum and RSI shows oversold reversal.
                </span>
              </div>

              {/* When triggered */}
              <div className="rounded-lg p-2.5 space-y-1.5"
                style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] font-semibold t-2 uppercase tracking-wide">Sequence when BTC hits ${btcShortEntry.toLocaleString()}</div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="t-2">Step 1 — Close BTC Short ({btcPair.short.size} BTC) → realise ~<span className="text-emerald-500 font-semibold">$0</span> (break-even)</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <CheckCircle2 size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="t-2">Step 2 — SOL pair is already fully closed (Phase 1 complete)</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <CheckCircle2 size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="t-2">Step 3 — Only BTC Long ({btcLongSize} @ ${btcLongEntry.toLocaleString()}) remains. Begin DCA below.</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px]">
                  <CheckCircle2 size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="t-2">Freed margin from BTC short: ~{fmtUSD((btcShortEntry * btcPair.short.size) / btcPair.short.leverage, 0)} available for DCA buys</span>
                </div>
              </div>

              {/* DCA Calculator */}
              <div>
                <div className="text-[11px] font-semibold t-2 mb-2">DCA Ladder (after closing BTC short)</div>

                {/* DCA size input */}
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-[11px] t-3 flex-shrink-0">BTC per level:</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={dcaSize}
                    onChange={e => setDcaSize(parseFloat(e.target.value) || 0.05)}
                    className="glass-input w-20 px-2 py-1 rounded-lg text-sm font-semibold text-center"
                  />
                  <span className="text-[10px] t-3">≈ {fmtUSD(marginPerDca(btcShortEntry), 0)} margin each</span>
                </div>

                {/* DCA level inputs + results */}
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-4 gap-1 px-3 py-1.5 text-[10px] font-semibold t-3 uppercase tracking-wide"
                    style={{ background: 'var(--surface-deep)', borderBottom: '1px solid var(--border)' }}>
                    <span>DCA Price</span>
                    <span>+Size</span>
                    <span>New Avg</span>
                    <span>Recover %</span>
                  </div>

                  {/* Original position row */}
                  <div className="grid grid-cols-4 gap-1 px-3 py-2 text-[11px]"
                    style={{ borderBottom: '1px solid var(--border)', background: 'rgba(239,68,68,0.04)' }}>
                    <span className="t-3 italic">Current</span>
                    <span className="t-2">{btcLongSize} BTC</span>
                    <span className="text-red-400 font-semibold">${btcLongEntry.toLocaleString()}</span>
                    <span className="text-red-400">{fmtPct(((btcLongEntry - btcCurrent) / btcCurrent) * 100)}</span>
                  </div>

                  {dcaLevelInputs.map((val, i) => {
                    const row = dcaRows[i];
                    return (
                      <div key={i} className="grid grid-cols-4 gap-1 px-3 py-1.5 items-center"
                        style={{ borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <input
                            type="number"
                            value={val}
                            onChange={e => {
                              const copy = [...dcaLevelInputs];
                              copy[i] = e.target.value;
                              setDcaLevelInputs(copy);
                            }}
                            className="glass-input w-full px-2 py-1 rounded-md text-xs font-mono"
                          />
                        </div>
                        <span className="text-[11px] t-3">+{dcaSize} BTC</span>
                        {row ? (
                          <>
                            <span className="text-[11px] font-semibold text-orange-400">
                              ${Math.round(row.avgEntry).toLocaleString()}
                            </span>
                            <span className="text-[11px] font-semibold text-blue-400">
                              +{fmtNum(row.recoverPct, 1)}%
                            </span>
                          </>
                        ) : (
                          <><span className="text-[11px] t-3">—</span><span className="text-[11px] t-3">—</span></>
                        )}
                      </div>
                    );
                  })}

                  {/* Final state */}
                  {dcaRows.length > 0 && (
                    <div className="grid grid-cols-4 gap-1 px-3 py-2 text-[11px] font-bold"
                      style={{ background: 'rgba(59,130,246,0.07)', borderTop: '1px solid rgba(59,130,246,0.2)' }}>
                      <span className="text-blue-400 col-span-2">After all DCA levels</span>
                      <span className="text-blue-400">
                        ${Math.round(dcaRows[dcaRows.length - 1].avgEntry).toLocaleString()} avg
                      </span>
                      <span className="text-blue-400">
                        +{fmtNum(dcaRows[dcaRows.length - 1].recoverPct, 1)}% to b/e
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-1.5 text-[10px] t-3 leading-snug">
                  "Recover %" = how much BTC needs to rise from that DCA price to break even on that level.
                  <span className="text-orange-400 ml-1">Original $119,633 long still requires BTC to recover fully for that leg to break even.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk note */}
      <div className="rounded-lg p-2.5 text-[11px] t-2"
        style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <span className="text-yellow-400 font-semibold">⚠ Plan assumes prices FALL further. </span>
        If BTC/SOL rally from here, both triggers are never hit and you stay delta-neutral indefinitely.
        That is fine — your equity is stable while hedged. Wait for the dip, execute on the way down.
      </div>
    </div>
  );
}

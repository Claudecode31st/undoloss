'use client';
import { useState } from 'react';
import { AlertTriangle, ShieldOff, CheckCircle2, XCircle, Info } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { usePortfolioRefresh } from '@/lib/usePortfolioRefresh';
import { calcPortfolioStats, fmtCurrency } from '@/lib/calculations';

type StopLevel = 'conservative' | 'balanced' | 'lastresort';

const STOP_CONFIG: Record<StopLevel, { label: string; drop: number; color: string; bg: string; border: string; reason: string }> = {
  conservative: {
    label: 'Conservative',
    drop: -10,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    reason: 'Limit further damage quickly. Use when the market structure is clearly bearish.',
  },
  balanced: {
    label: 'Balanced',
    drop: -20,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    reason: 'Allows normal volatility to play out. Exit on confirmed structural breakdown.',
  },
  lastresort: {
    label: 'Last Resort',
    drop: -35,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    reason: 'Maximum pain before cutting. Only if you have very high conviction in recovery.',
  },
};

export default function ExitGuardian() {
  const { portfolio, refreshing, lastUpdated, refresh } = usePortfolioRefresh();
  const [stopLevel, setStopLevel] = useState<StopLevel>('balanced');

  if (!portfolio) return <div className="t-3 p-8">Loading…</div>;
  if (portfolio.assets.length === 0) {
    return (
      <>
        <Header title="Exit Guardian" subtitle="Know when to cut losses" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
        <GlassCard className="p-8 text-center"><p className="t-3 text-sm">Add assets to your portfolio first.</p></GlassCard>
      </>
    );
  }

  const stats = calcPortfolioStats(portfolio.assets);
  const cfg = STOP_CONFIG[stopLevel];
  const dropMultiplier = 1 + cfg.drop / 100;

  /* ── Per-asset calculations ──────────────────────────────────── */
  const assetData = portfolio.assets.map((asset) => {
    const costBasis = asset.entryPrice * asset.amount;
    const currentValue = asset.currentPrice * asset.amount;
    const drawdownPct = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
    const gainNeededNow = asset.currentPrice > 0 ? Math.max(0, (asset.entryPrice / asset.currentPrice - 1) * 100) : 0;
    const recoveryMultiple = 1 + gainNeededNow / 100; // e.g. 5 = 5x needed

    // Stop price
    const stopPrice = asset.currentPrice * dropMultiplier;
    const valueAtStop = stopPrice * asset.amount;
    const lossAtStop = valueAtStop - costBasis; // negative
    const lossAtStopPct = costBasis > 0 ? (lossAtStop / costBasis) * 100 : 0;
    const gainNeededAtStop = stopPrice > 0 ? Math.max(0, (asset.entryPrice / stopPrice - 1) * 100) : 0;
    const multipleAtStop = 1 + gainNeededAtStop / 100;

    // Point of no return: price at which required gain becomes 5x (400%+)
    // entryPrice / noReturnPrice = 5  →  noReturnPrice = entryPrice / 5
    const noReturnPrice = asset.entryPrice / 5;
    const noReturnDropFromCurrent = asset.currentPrice > 0
      ? ((noReturnPrice - asset.currentPrice) / asset.currentPrice) * 100
      : 0;
    const alreadyNoReturn = gainNeededNow >= 400; // already needs 5x+

    return {
      asset, costBasis, currentValue, drawdownPct, gainNeededNow, recoveryMultiple,
      stopPrice, valueAtStop, lossAtStop, lossAtStopPct, gainNeededAtStop, multipleAtStop,
      noReturnPrice, noReturnDropFromCurrent, alreadyNoReturn,
    };
  });

  /* ── Portfolio-level ─────────────────────────────────────────── */
  const portfolioStopValue = stats.totalValue * dropMultiplier;
  const portfolioLossAtStop = portfolioStopValue - stats.totalInvested;
  const portfolioLossAtStopPct = stats.totalInvested > 0 ? (portfolioLossAtStop / stats.totalInvested) * 100 : 0;
  const portfolioGainNeededNow = stats.totalValue > 0 ? Math.max(0, (stats.totalInvested / stats.totalValue - 1) * 100) : 0;
  const portfolioGainNeededAtStop = portfolioStopValue > 0 ? Math.max(0, (stats.totalInvested / portfolioStopValue - 1) * 100) : 0;

  return (
    <>
      <Header title="Exit Guardian" subtitle="Know exactly when and how to cut losses" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />

      {/* ── Stop Level Selector ──────────────────────────────────── */}
      <GlassCard className="p-5 mb-4">
        <h2 className="text-sm font-semibold t-1 mb-1">Stop-Loss Level</h2>
        <p className="text-xs t-3 mb-4">How much more drawdown are you willing to accept from today's prices?</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(Object.entries(STOP_CONFIG) as [StopLevel, typeof cfg][]).map(([key, c]) => (
            <button
              key={key}
              onClick={() => setStopLevel(key)}
              className={`p-3 rounded-xl text-left transition-all ${stopLevel === key ? `${c.bg} ${c.border} border` : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              style={stopLevel !== key ? { border: '1px solid var(--border)' } : {}}
            >
              <div className={`text-xs font-bold mb-1 ${stopLevel === key ? c.color : 't-2'}`}>{c.label}</div>
              <div className="text-lg font-bold t-1">{c.drop}%</div>
              <div className="text-[10px] t-3 mt-0.5">from current</div>
            </button>
          ))}
        </div>
        <div className={`p-3 rounded-xl text-xs t-2 ${cfg.bg}`} style={{ border: `1px solid` }}>
          <span className={`font-semibold ${cfg.color}`}>{cfg.label}: </span>{cfg.reason}
        </div>
      </GlassCard>

      {/* ── Portfolio-level Stop ─────────────────────────────────── */}
      <GlassCard className="p-5 mb-4" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
        <h2 className="text-sm font-semibold t-1 mb-3">Portfolio-Level Exit Rule</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Stop triggers at', value: fmtCurrency(portfolioStopValue), sub: `${cfg.drop}% from ${fmtCurrency(stats.totalValue)}`, color: cfg.color },
            { label: 'Total loss if triggered', value: fmtCurrency(portfolioLossAtStop), sub: `${portfolioLossAtStopPct.toFixed(1)}% of invested`, color: 'text-red-500' },
            { label: 'Recovery need now', value: `+${portfolioGainNeededNow.toFixed(1)}%`, sub: 'current breakeven', color: 'text-orange-500' },
            { label: 'Recovery need at stop', value: `+${portfolioGainNeededAtStop.toFixed(1)}%`, sub: 'if stop triggered', color: 'text-red-500' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] t-3 mb-1">{item.label}</div>
              <div className={`text-base font-bold ${item.color}`}>{item.value}</div>
              <div className="text-[10px] t-3 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* What to do if triggered */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold t-1 mb-3">If this stop triggers — your action plan:</div>
          <div className="space-y-2">
            {[
              { step: '1', text: `Sell the worst-performing asset first (most down, least recovery potential)`, color: 'text-red-500' },
              { step: '2', text: 'Do NOT immediately re-enter. Wait at least 72 hours for clarity.', color: 'text-orange-500' },
              { step: '3', text: 'Move proceeds to stablecoins. This is not a loss — it\'s preserving buying power.', color: 'text-blue-500' },
              { step: '4', text: 'Re-evaluate in 1–2 weeks. Only re-enter if market structure has changed.', color: 'text-emerald-500' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white ${
                  s.color === 'text-red-500' ? 'bg-red-500' :
                  s.color === 'text-orange-500' ? 'bg-orange-500' :
                  s.color === 'text-blue-500' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}>
                  {s.step}
                </div>
                <span className="text-xs t-2 leading-relaxed">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ── Per-Asset Stop Levels ────────────────────────────────── */}
      <div className="space-y-3">
        {assetData.map(({
          asset, drawdownPct, gainNeededNow, recoveryMultiple,
          stopPrice, lossAtStop, lossAtStopPct, gainNeededAtStop, multipleAtStop,
          noReturnPrice, noReturnDropFromCurrent, alreadyNoReturn,
        }) => (
          <GlassCard key={asset.id} className="p-5">
            {/* Asset header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ backgroundColor: asset.color + '22', border: `1px solid ${asset.color}44`, color: asset.color }}>
                  {asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold t-1">{asset.symbol}</div>
                  <div className="text-[10px] t-3">
                    Entry {fmtCurrency(asset.entryPrice)} · Now {fmtCurrency(asset.currentPrice)} · {drawdownPct.toFixed(1)}% drawdown
                  </div>
                </div>
              </div>
              {/* Recovery multiple badge */}
              <div className={`px-3 py-1.5 rounded-xl text-right ${
                recoveryMultiple >= 5 ? 'bg-red-500/10' : recoveryMultiple >= 3 ? 'bg-orange-500/10' : 'bg-yellow-500/10'
              }`} style={{ border: `1px solid ${recoveryMultiple >= 5 ? 'rgba(239,68,68,0.25)' : recoveryMultiple >= 3 ? 'rgba(249,115,22,0.25)' : 'rgba(234,179,8,0.25)'}` }}>
                <div className="text-[10px] t-3">Recovery needed</div>
                <div className={`text-sm font-bold ${recoveryMultiple >= 5 ? 'text-red-500' : recoveryMultiple >= 3 ? 'text-orange-500' : 'text-yellow-600'}`}>
                  {recoveryMultiple.toFixed(1)}x
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Stop price */}
              <div className={`rounded-xl p-3 ${cfg.bg}`} style={{ border: `1px solid ${cfg.border.replace('border-', '')}` }}>
                <div className="text-[10px] t-3 mb-1">{cfg.label} stop price</div>
                <div className={`text-xl font-bold ${cfg.color}`}>{fmtCurrency(stopPrice)}</div>
                <div className="text-[10px] t-3 mt-1">{cfg.drop}% from {fmtCurrency(asset.currentPrice)}</div>
                <div className="text-[10px] t-3 mt-0.5">
                  Loss if hit: <span className="text-red-500 font-medium">{fmtCurrency(lossAtStop)} ({lossAtStopPct.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Recovery if stop triggered */}
              <div className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] t-3 mb-1">If stop triggers, need</div>
                <div className="text-xl font-bold text-red-500">+{gainNeededAtStop.toFixed(0)}%</div>
                <div className="text-[10px] t-3 mt-1">from stop price to break even</div>
                <div className="text-[10px] t-3 mt-0.5">
                  That's a <span className="font-medium t-2">{multipleAtStop.toFixed(1)}x</span> from the stop
                </div>
              </div>

              {/* Point of no return */}
              <div className={`rounded-xl p-3 ${alreadyNoReturn ? 'bg-red-500/10' : 'bg-yellow-500/5'}`}
                style={{ border: `1px solid ${alreadyNoReturn ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.2)'}` }}>
                <div className="text-[10px] t-3 mb-1">Point of no return</div>
                {alreadyNoReturn ? (
                  <>
                    <div className="text-sm font-bold text-red-500">Already here</div>
                    <div className="text-[10px] text-red-400 mt-1">Needs {recoveryMultiple.toFixed(1)}x — historically rare in &lt;3 yrs</div>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold text-yellow-600">{fmtCurrency(noReturnPrice)}</div>
                    <div className="text-[10px] t-3 mt-1">{noReturnDropFromCurrent.toFixed(1)}% more drop from now</div>
                    <div className="text-[10px] t-3 mt-0.5">Below this = 5x+ recovery needed</div>
                  </>
                )}
              </div>
            </div>

            {/* Verdict */}
            {alreadyNoReturn && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 flex items-start gap-2" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 leading-relaxed">
                  <span className="font-semibold text-red-500">Already past point of no return. </span>
                  {asset.symbol} needs {recoveryMultiple.toFixed(1)}x from here. This requires a rare, sustained bull market.
                  DCAing more capital here amplifies risk without guaranteeing recovery. Consider cutting and redeploying into stronger positions.
                </p>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </>
  );
}

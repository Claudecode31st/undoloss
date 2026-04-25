'use client';
import { useState, useMemo } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcPortfolioStats, fmtCurrency, fmtNumber } from '@/lib/calculations';

interface Props { assets: CryptoAsset[] }

export default function AverageDownDetail({ assets }: Props) {
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [months, setMonths]               = useState(6);
  const [distribution, setDistribution]   = useState<'equal' | 'drawdown'>('drawdown');

  const stats = useMemo(() => calcPortfolioStats(assets), [assets]);

  const weights = useMemo(() => {
    if (assets.length === 0) return {};
    if (distribution === 'equal') return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    const losses = assets.map((a) => ({ id: a.id, loss: Math.max(0, ((a.entryPrice - a.currentPrice) / a.entryPrice) * 100) }));
    const total  = losses.reduce((s, d) => s + d.loss, 0);
    if (total === 0) return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    return Object.fromEntries(losses.map((d) => [d.id, d.loss / total]));
  }, [assets, distribution]);

  const schedule = useMemo(() => assets.map((asset) => {
    const mb     = monthlyBudget * (weights[asset.id] ?? 1 / Math.max(assets.length, 1));
    const totalD = mb * months;
    let cumTokens = asset.amount;
    let cumCost   = asset.entryPrice * asset.amount;
    const monthly: { month: number; buy: number; avgEntry: number; gainNeeded: number }[] = [];
    for (let i = 1; i <= months; i++) {
      const newT  = asset.currentPrice > 0 ? mb / asset.currentPrice : 0;
      cumTokens  += newT;
      cumCost    += mb;
      const avg   = cumTokens > 0 ? cumCost / cumTokens : 0;
      const need  = asset.currentPrice > 0 ? Math.max(0, (avg / asset.currentPrice - 1) * 100) : 0;
      monthly.push({ month: i, buy: mb, avgEntry: avg, gainNeeded: need });
    }
    const newAvg      = monthly[monthly.length - 1]?.avgEntry ?? asset.entryPrice;
    const gainBefore  = asset.currentPrice > 0 ? Math.max(0, (asset.entryPrice / asset.currentPrice - 1) * 100) : 0;
    const gainAfter   = monthly[monthly.length - 1]?.gainNeeded ?? gainBefore;
    const improvement = gainBefore - gainAfter;
    const coinsAdded  = asset.currentPrice > 0 ? totalD / asset.currentPrice : 0;
    const drawdownPct = asset.entryPrice > 0 ? ((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100 : 0;
    return { asset, mb, totalD, newAvg, gainBefore, gainAfter, improvement, coinsAdded, drawdownPct, monthly };
  }), [assets, monthlyBudget, months, weights]);

  const totalDeployed = monthlyBudget * months;
  const holdBE        = stats.totalValue > 0 ? Math.max(0, (stats.totalInvested / stats.totalValue - 1) * 100) : 0;
  const afterBE       = (stats.totalValue + totalDeployed) > 0
    ? Math.max(0, (stats.totalInvested + totalDeployed) / (stats.totalValue + totalDeployed) * 100 - 100) : 0;
  const ppSaved       = holdBE - afterBE;

  if (assets.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Controls bar ── */}
      <GlassCard className="px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] t-3 font-medium">Duration</span>
          <div className="flex gap-1">
            {[3, 6, 12].map((m) => (
              <button key={m} onClick={() => setMonths(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${months === m ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${months === m ? '#f97316' : 'var(--border)'}` }}>
                {m}mo
              </button>
            ))}
          </div>
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <span className="text-[11px] t-3 font-medium">Split</span>
          <div className="flex gap-1">
            {(['equal', 'drawdown'] as const).map((d) => (
              <button key={d} onClick={() => setDistribution(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${distribution === d ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${distribution === d ? '#f97316' : 'var(--border)'}` }}>
                {d === 'equal' ? 'Equal' : 'By Loss'}
              </button>
            ))}
          </div>
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-2 flex-1 min-w-[160px] max-w-[280px]">
            <span className="text-[11px] t-3 whitespace-nowrap">Budget</span>
            <input type="range" min={50} max={5000} step={50} value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #f97316 ${(monthlyBudget / 5000) * 100}%, var(--border-strong) ${(monthlyBudget / 5000) * 100}%)`, touchAction: 'none' }} />
            <span className="text-sm font-bold text-orange-500 whitespace-nowrap w-16 text-right">{fmtCurrency(monthlyBudget, 0)}/mo</span>
          </div>

          {/* Summary — grouped as one visual unit */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] t-3">Deploy <span className="font-bold text-orange-500">{fmtCurrency(totalDeployed, 0)}</span></span>
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
            {/* Breakeven before → after grouped in one pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
              <div className="text-center">
                <div className="text-[9px] t-3 leading-none mb-0.5">BE now</div>
                <div className={`text-[11px] font-bold leading-none ${holdBE > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {holdBE > 0 ? `+${holdBE.toFixed(1)}%` : '✓'}
                </div>
              </div>
              <span className="text-[10px] t-3">→</span>
              <div className="text-center">
                <div className="text-[9px] t-3 leading-none mb-0.5">after</div>
                <div className="text-[11px] font-bold leading-none text-emerald-500">
                  {afterBE > 0 ? `+${afterBE.toFixed(1)}%` : '✓'}
                </div>
              </div>
            </div>
            {ppSaved > 0.1 && (
              <span className="text-[10px] font-bold text-emerald-500 px-1.5 py-1 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                −{ppSaved.toFixed(1)}pp saved
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── 50/50 panels ── */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">

        {/* Left: Per-Asset Plan */}
        <GlassCard className="flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold t-1">Per-Asset Plan</div>
            <div className="text-[11px] t-3 mt-0.5">{months}-month average-down impact per position</div>
          </div>

          {/* Column labels — with now→after hint on the paired columns */}
          <div className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-6 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-[10px] t-3 font-medium uppercase tracking-wide">Asset</div>
            <div className="w-16 flex-shrink-0 text-[10px] t-3 font-medium uppercase tracking-wide">Down</div>
            <div className="w-24 flex-shrink-0 text-[10px] t-3 font-medium uppercase tracking-wide">Budget</div>
            <div className="w-36 flex-shrink-0">
              <div className="text-[10px] t-3 font-medium uppercase tracking-wide">Avg Entry</div>
              <div className="text-[9px] t-3 opacity-60">now → after</div>
            </div>
            <div className="w-28 flex-shrink-0 text-right">
              <div className="text-[10px] t-3 font-medium uppercase tracking-wide">Breakeven</div>
              <div className="text-[9px] t-3 opacity-60">now → after</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-1.5">
            {schedule.map(({ asset, mb, totalD, newAvg, gainBefore, gainAfter, improvement, coinsAdded, drawdownPct }) => (
              <div key={asset.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>

                {/* Avatar */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                  {asset.symbol.slice(0, 1)}
                </div>

                {/* Symbol */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold t-1 leading-tight">{asset.symbol}</div>
                  <div className="text-[10px] t-3 truncate">{asset.name}</div>
                </div>

                {/* Drawdown */}
                <div className="w-16 flex-shrink-0">
                  <div className={`text-[11px] font-semibold ${drawdownPct < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {drawdownPct >= 0 ? '+' : ''}{drawdownPct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] t-3">{fmtCurrency(asset.currentPrice)}</div>
                </div>

                {/* Budget */}
                <div className="w-24 flex-shrink-0">
                  <div className="text-[11px] font-semibold t-1">{fmtCurrency(mb, 0)}<span className="text-[10px] t-3">/mo</span></div>
                  <div className="text-[10px] t-3">+{fmtNumber(coinsAdded, coinsAdded < 1 ? 3 : 1)} {asset.symbol}</div>
                </div>

                {/* Avg Entry: now (dimmed) → after (bold green) */}
                <div className="w-36 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] t-3 line-through opacity-50">{fmtCurrency(asset.entryPrice)}</span>
                    <span className="text-[10px] t-3">→</span>
                    <span className="text-[12px] font-bold text-emerald-500">{fmtCurrency(newAvg)}</span>
                  </div>
                  {improvement > 0.1 && (
                    <span className="inline-block text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 rounded-full mt-0.5"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      −{improvement.toFixed(1)}pp easier
                    </span>
                  )}
                </div>

                {/* Breakeven: now (red pill) → after (green pill) */}
                <div className="w-28 flex-shrink-0 flex items-center justify-end gap-1">
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${gainBefore > 0 ? 'text-red-500' : 'text-emerald-500'}`}
                    style={{ background: gainBefore > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }}>
                    {gainBefore > 0 ? `+${gainBefore.toFixed(1)}%` : '✓'}
                  </span>
                  <span className="text-[10px] t-3">→</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${gainAfter > 0 ? 'text-emerald-600' : 'text-emerald-500'}`}
                    style={{ background: gainAfter > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.12)' }}>
                    {gainAfter > 0 ? `+${gainAfter.toFixed(1)}%` : '✓'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right: Monthly Schedule */}
        <GlassCard className="flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold t-1">Monthly Schedule</div>
            <div className="text-[11px] t-3 mt-0.5">What to buy each month</div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left text-[10px] t-3 font-medium px-3 py-2 sticky left-0 z-20"
                    style={{ background: 'var(--surface)', minWidth: 44 }}>Asset</th>
                  {Array.from({ length: months }, (_, i) => (
                    <th key={i} className="text-left text-[10px] t-3 font-medium px-2 py-2 whitespace-nowrap"
                      style={{ minWidth: 88 }}>Mo {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map(({ asset, monthly }) => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-2 sticky left-0" style={{ background: 'var(--surface)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                        {asset.symbol.slice(0, 1)}
                      </div>
                    </td>
                    {monthly.map((m) => (
                      <td key={m.month} className="px-2 py-1.5">
                        <div className="rounded-lg px-2 py-1.5 space-y-0.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                          {/* Buy amount — primary */}
                          <div className="text-[12px] font-bold t-1">{fmtCurrency(m.buy, 0)}</div>
                          {/* Avg entry after this buy */}
                          <div className="flex items-center gap-0.5">
                            <span className="text-[8px] t-3 uppercase tracking-wide">avg entry</span>
                            <span className="text-[9px] font-semibold t-2">{fmtCurrency(m.avgEntry)}</span>
                          </div>
                          {/* Breakeven % remaining */}
                          <div className="flex items-center gap-0.5">
                            <span className="text-[8px] t-3 uppercase tracking-wide">breakeven</span>
                            <span className={`text-[9px] font-bold ${m.gainNeeded > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                              {m.gainNeeded > 0 ? `+${m.gainNeeded.toFixed(1)}%` : '✓'}
                            </span>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2 sticky left-0 text-[10px] t-3 font-semibold" style={{ background: 'var(--surface)' }}>Total</td>
                  {Array.from({ length: months }, (_, i) => (
                    <td key={i} className="px-2 py-1.5">
                      <div className="rounded-lg px-2 py-1.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                        <div className="text-[12px] font-bold text-orange-500">{fmtCurrency(monthlyBudget, 0)}</div>
                        <div className="text-[9px] t-3">cum. {fmtCurrency(monthlyBudget * (i + 1), 0)}</div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}

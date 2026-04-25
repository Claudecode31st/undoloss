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
    const monthly: { month: number; buy: number; avgCost: number; stillNeed: number }[] = [];
    for (let i = 1; i <= months; i++) {
      const newT  = asset.currentPrice > 0 ? mb / asset.currentPrice : 0;
      cumTokens  += newT;
      cumCost    += mb;
      const avg   = cumTokens > 0 ? cumCost / cumTokens : 0;
      const need  = asset.currentPrice > 0 ? Math.max(0, (avg / asset.currentPrice - 1) * 100) : 0;
      monthly.push({ month: i, buy: mb, avgCost: avg, stillNeed: need });
    }
    const newAvgCost   = monthly[monthly.length - 1]?.avgCost ?? asset.entryPrice;
    const needNow      = asset.currentPrice > 0 ? Math.max(0, (asset.entryPrice / asset.currentPrice - 1) * 100) : 0;
    const needAfter    = monthly[monthly.length - 1]?.stillNeed ?? needNow;
    const improvement  = needNow - needAfter;
    const coinsAdded   = asset.currentPrice > 0 ? totalD / asset.currentPrice : 0;
    const changePct    = asset.entryPrice > 0 ? ((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100 : 0;
    return { asset, mb, totalD, newAvgCost, needNow, needAfter, improvement, coinsAdded, changePct, monthly };
  }), [assets, monthlyBudget, months, weights]);

  const totalDeployed = monthlyBudget * months;
  const needNowAll    = stats.totalValue > 0 ? Math.max(0, (stats.totalInvested / stats.totalValue - 1) * 100) : 0;
  const needAfterAll  = (stats.totalValue + totalDeployed) > 0
    ? Math.max(0, (stats.totalInvested + totalDeployed) / (stats.totalValue + totalDeployed) * 100 - 100) : 0;
  const easier        = needNowAll - needAfterAll;

  if (assets.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Controls bar ── */}
      <GlassCard className="px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] t-3 font-medium">Buy for</span>
          <div className="flex gap-1">
            {[3, 6, 12].map((m) => (
              <button key={m} onClick={() => setMonths(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${months === m ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${months === m ? '#f97316' : 'var(--border)'}` }}>
                {m} months
              </button>
            ))}
          </div>
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <span className="text-[11px] t-3 font-medium">Spread</span>
          <div className="flex gap-1">
            {(['equal', 'drawdown'] as const).map((d) => (
              <button key={d} onClick={() => setDistribution(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${distribution === d ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${distribution === d ? '#f97316' : 'var(--border)'}` }}>
                {d === 'equal' ? 'Equally' : 'More to losers'}
              </button>
            ))}
          </div>
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-2 flex-1 min-w-[160px] max-w-[280px]">
            <span className="text-[11px] t-3 whitespace-nowrap">Monthly budget</span>
            <input type="range" min={50} max={5000} step={50} value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #f97316 ${(monthlyBudget / 5000) * 100}%, var(--border-strong) ${(monthlyBudget / 5000) * 100}%)`, touchAction: 'none' }} />
            <span className="text-sm font-bold text-orange-500 whitespace-nowrap w-16 text-right">{fmtCurrency(monthlyBudget, 0)}/mo</span>
          </div>
          {/* Summary */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-[11px] t-3">Invest <span className="font-bold text-orange-500">{fmtCurrency(totalDeployed, 0)}</span> total</span>
            <span className="text-[11px] t-3">·</span>
            <span className="text-[11px] t-3">Need <span className={`font-bold ${needNowAll > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{needNowAll > 0 ? `+${needNowAll.toFixed(1)}%` : 'nothing'}</span> now</span>
            <span className="text-[11px] t-3">→</span>
            <span className="text-[11px] t-3">only <span className="font-bold text-emerald-500">{needAfterAll > 0 ? `+${needAfterAll.toFixed(1)}%` : 'nothing'}</span> after</span>
            {easier > 0.1 && (
              <span className="text-[10px] font-bold text-emerald-500 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                {easier.toFixed(1)}% easier
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── 50/50 panels ── */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">

        {/* Left: Impact per coin */}
        <GlassCard className="flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold t-1">Impact Per Coin</div>
            <div className="text-[11px] t-3 mt-0.5">How {months} months of buying lowers your average cost</div>
          </div>

          {/* Column labels */}
          <div className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0">
            <div className="w-6 flex-shrink-0" />
            <div className="flex-1 min-w-0 text-[10px] t-3 font-medium uppercase tracking-wide">Coin</div>
            <div className="w-16 flex-shrink-0 text-[10px] t-3 font-medium uppercase tracking-wide">vs Entry</div>
            <div className="w-24 flex-shrink-0 text-[10px] t-3 font-medium uppercase tracking-wide">Buy/mo</div>
            <div className="w-36 flex-shrink-0 text-[10px] t-3 font-medium uppercase tracking-wide">Avg Cost</div>
            <div className="w-28 flex-shrink-0 text-[10px] t-3 font-medium uppercase tracking-wide text-right">Need to even</div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {schedule.map(({ asset, mb, totalD, newAvgCost, needNow, needAfter, improvement, coinsAdded, changePct }) => (
              <div key={asset.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
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

                {/* Price change vs entry */}
                <div className="w-16 flex-shrink-0">
                  <div className={`text-[11px] font-semibold ${changePct < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] t-3">{fmtCurrency(asset.currentPrice)}</div>
                </div>

                {/* Monthly buy */}
                <div className="w-24 flex-shrink-0">
                  <div className="text-[11px] font-semibold t-1">{fmtCurrency(mb, 0)}<span className="text-[10px] t-3">/mo</span></div>
                  <div className="text-[10px] t-3">+{fmtNumber(coinsAdded, coinsAdded < 1 ? 3 : 1)} coins</div>
                </div>

                {/* Avg cost before → after */}
                <div className="w-36 flex-shrink-0">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="t-3">{fmtCurrency(asset.entryPrice)}</span>
                    <span className="t-3">→</span>
                    <span className="font-bold text-emerald-500">{fmtCurrency(newAvgCost)}</span>
                  </div>
                  {improvement > 0.1 && (
                    <div className="text-[10px] font-semibold text-emerald-500">{improvement.toFixed(1)}% less needed</div>
                  )}
                </div>

                {/* Need to break even: now → after */}
                <div className="w-28 flex-shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1 text-[11px]">
                    <span className={needNow > 0 ? 'text-red-500 font-medium' : 'text-emerald-500'}>
                      {needNow > 0 ? `+${needNow.toFixed(1)}%` : 'even'}
                    </span>
                    <span className="t-3">→</span>
                    <span className={`font-bold ${needAfter > 0 ? 'text-emerald-600' : 'text-emerald-500'}`}>
                      {needAfter > 0 ? `+${needAfter.toFixed(1)}%` : 'even'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right: Month-by-month plan */}
        <GlassCard className="flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold t-1">Month-by-Month Plan</div>
            <div className="text-[11px] t-3 mt-0.5">How much to buy each month and what it does to your cost</div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left text-[10px] t-3 font-medium px-3 py-2 sticky left-0 z-20"
                    style={{ background: 'var(--surface)', minWidth: 44 }}>Coin</th>
                  {Array.from({ length: months }, (_, i) => (
                    <th key={i} className="text-left text-[10px] t-3 font-medium px-2 py-2 whitespace-nowrap"
                      style={{ minWidth: 92 }}>Month {i + 1}</th>
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
                        <div className="rounded-lg px-2 py-1.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                          <div className="text-[11px] font-bold t-1">{fmtCurrency(m.buy, 0)}</div>
                          <div className="text-[9px] t-3">avg cost {fmtCurrency(m.avgCost)}</div>
                          <div className={`text-[9px] font-semibold ${m.stillNeed > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                            {m.stillNeed > 0 ? `need +${m.stillNeed.toFixed(1)}%` : 'at even'}
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
                        <div className="text-[11px] font-bold text-orange-500">{fmtCurrency(monthlyBudget, 0)}</div>
                        <div className="text-[9px] t-3">spent {fmtCurrency(monthlyBudget * (i + 1), 0)}</div>
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

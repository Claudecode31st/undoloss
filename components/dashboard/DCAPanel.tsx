'use client';
import { useState, useMemo } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcPortfolioStats, fmtCurrency } from '@/lib/calculations';

interface DCAPanelProps {
  assets: CryptoAsset[];
}

export default function DCAPanel({ assets }: DCAPanelProps) {
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [months, setMonths] = useState(6);
  const [distribution, setDistribution] = useState<'equal' | 'drawdown'>('drawdown');

  const stats = useMemo(() => calcPortfolioStats(assets), [assets]);

  const weights = useMemo(() => {
    if (assets.length === 0) return {};
    if (distribution === 'equal') return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    const losses = assets.map((a) => ({ id: a.id, loss: Math.max(0, ((a.entryPrice - a.currentPrice) / a.entryPrice) * 100) }));
    const total = losses.reduce((s, d) => s + d.loss, 0);
    if (total === 0) return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    return Object.fromEntries(losses.map((d) => [d.id, d.loss / total]));
  }, [assets, distribution]);

  const schedule = useMemo(() => assets.map((asset) => {
    const budget = monthlyBudget * (weights[asset.id] ?? 1 / Math.max(assets.length, 1));
    let cumTokens = asset.amount;
    let cumCost = asset.entryPrice * asset.amount;
    for (let i = 0; i < months; i++) {
      const newTokens = asset.currentPrice > 0 ? budget / asset.currentPrice : 0;
      cumTokens += newTokens;
      cumCost += budget;
    }
    const newAvg = cumTokens > 0 ? cumCost / cumTokens : 0;
    const gainBefore = asset.currentPrice > 0 ? Math.max(0, (asset.entryPrice / asset.currentPrice - 1) * 100) : 0;
    const gainAfter = asset.currentPrice > 0 ? Math.max(0, (newAvg / asset.currentPrice - 1) * 100) : 0;
    const improvement = gainBefore - gainAfter;
    const totalDeployed = budget * months;
    return { asset, newAvg, gainBefore, gainAfter, improvement, totalDeployed, monthlyBudget: budget };
  }), [assets, monthlyBudget, months, weights]);

  const totalDeployed = monthlyBudget * months;
  const holdBreakevenReq = stats.totalValue > 0 ? Math.max(0, (stats.totalInvested / stats.totalValue - 1) * 100) : 0;
  const newTotalInvested = stats.totalInvested + totalDeployed;
  const newTotalValue = stats.totalValue + totalDeployed;
  const newBreakevenReq = newTotalValue > 0 ? Math.max(0, (newTotalInvested / newTotalValue - 1) * 100) : 0;
  const summaryImprovement = holdBreakevenReq - newBreakevenReq;

  if (assets.length === 0) return null;

  return (
    <GlassCard className="p-4">
      {/* Header + controls inline */}
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Average Down
        </h2>
        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Duration chips */}
          <div className="flex gap-1">
            {[3, 6, 12].map((m) => (
              <button key={m} onClick={() => setMonths(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${months === m ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${months === m ? '#f97316' : 'var(--border)'}` }}>
                {m}mo
              </button>
            ))}
          </div>
          {/* Allocation method */}
          <div className="flex gap-1">
            {(['equal', 'drawdown'] as const).map((d) => (
              <button key={d} onClick={() => setDistribution(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${distribution === d ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${distribution === d ? '#f97316' : 'var(--border)'}` }}>
                {d === 'equal' ? 'Equal' : 'By Loss'}
              </button>
            ))}
          </div>
          {/* Budget slider */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <span className="text-[10px] t-3 whitespace-nowrap">Budget</span>
            <input type="range" min={50} max={5000} step={50} value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #f97316 ${(monthlyBudget / 5000) * 100}%, var(--border-strong) ${(monthlyBudget / 5000) * 100}%)`, touchAction: 'none' }} />
            <span className="text-xs font-bold text-orange-500 whitespace-nowrap w-12 text-right">{fmtCurrency(monthlyBudget, 0)}/mo</span>
          </div>
        </div>
      </div>

      {/* Impact summary — 4 chips */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Total deploy', value: fmtCurrency(totalDeployed, 0), sub: `${fmtCurrency(monthlyBudget, 0)} × ${months}mo`, color: 'text-orange-500' },
          { label: 'Breakeven now', value: `+${holdBreakevenReq.toFixed(1)}%`, sub: 'hold only', color: 'text-red-500' },
          { label: 'After plan', value: `+${newBreakevenReq.toFixed(1)}%`, sub: 'new breakeven', color: 'text-emerald-500' },
          { label: 'Saved', value: `−${summaryImprovement.toFixed(1)}pp`, sub: summaryImprovement > 0 ? 'improvement' : 'no change', color: 'text-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg px-2.5 py-2" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
            <div className="text-[9px] t-3 mb-0.5">{s.label}</div>
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[9px] t-3">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Per-asset compact rows */}
      <div className="border-t pt-2.5 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] t-3 uppercase tracking-wider font-medium mb-1.5">Per-Asset Schedule</div>
        {schedule.map(({ asset, newAvg, gainBefore, gainAfter, improvement, totalDeployed: td, monthlyBudget: mb }) => (
          <div key={asset.id} className="rounded-lg px-2.5 py-2 flex items-center gap-3"
            style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
              style={{ backgroundColor: asset.color + '33', border: `1px solid ${asset.color}55`, color: asset.color }}>
              {asset.symbol.slice(0, 2)}
            </div>
            {/* Symbol + monthly */}
            <div className="min-w-[70px]">
              <div className="text-xs font-semibold t-1">{asset.symbol}</div>
              <div className="text-[9px] t-3">{fmtCurrency(mb, 0)}/mo · {fmtCurrency(td, 0)} total</div>
            </div>
            {/* New avg entry */}
            <div className="flex-1">
              <div className="text-[9px] t-3">New avg entry</div>
              <div className="text-xs font-semibold t-1">{fmtCurrency(newAvg)}</div>
            </div>
            {/* Breakeven before → after */}
            <div className="flex items-center gap-1.5 text-xs tabular-nums">
              <span className="text-red-500 font-semibold">+{gainBefore.toFixed(1)}%</span>
              <span className="t-3 text-[10px]">→</span>
              <span className="text-emerald-500 font-semibold">+{gainAfter.toFixed(1)}%</span>
            </div>
            {/* Improvement badge */}
            {improvement > 0.1 && (
              <div className="text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                −{improvement.toFixed(1)}pp
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

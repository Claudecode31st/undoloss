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
    const drawdownPct = asset.entryPrice > 0 ? ((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100 : 0;
    return { asset, newAvg, gainBefore, gainAfter, improvement, monthlyBudget: budget, drawdownPct };
  }), [assets, monthlyBudget, months, weights]);

  const totalDeployed = monthlyBudget * months;
  const holdBE = stats.totalValue > 0 ? Math.max(0, (stats.totalInvested / stats.totalValue - 1) * 100) : 0;
  const newTotalValue = stats.totalValue + totalDeployed;
  const newTotalInvested = stats.totalInvested + totalDeployed;
  const afterBE = newTotalValue > 0 ? Math.max(0, (newTotalInvested / newTotalValue - 1) * 100) : 0;
  const ppSaved = holdBE - afterBE;

  if (assets.length === 0) return null;

  return (
    <GlassCard className="overflow-hidden">

      {/* Header + inline controls */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Average Down
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Duration */}
            <div className="flex gap-1">
              {[3, 6, 12].map((m) => (
                <button key={m} onClick={() => setMonths(m)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${months === m ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  style={{ border: `1px solid ${months === m ? '#f97316' : 'var(--border)'}` }}>
                  {m}mo
                </button>
              ))}
            </div>
            {/* Split */}
            <div className="flex gap-1">
              {(['equal', 'drawdown'] as const).map((d) => (
                <button key={d} onClick={() => setDistribution(d)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${distribution === d ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  style={{ border: `1px solid ${distribution === d ? '#f97316' : 'var(--border)'}` }}>
                  {d === 'equal' ? 'Equal' : 'By Loss'}
                </button>
              ))}
            </div>
            {/* Budget slider */}
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <input type="range" min={50} max={5000} step={50} value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                onTouchStart={(e) => e.stopPropagation()}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #f97316 ${(monthlyBudget / 5000) * 100}%, var(--border-strong) ${(monthlyBudget / 5000) * 100}%)`, touchAction: 'none' }} />
              <span className="text-[11px] font-bold text-orange-500 whitespace-nowrap w-14 text-right">{fmtCurrency(monthlyBudget, 0)}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Investing */}
        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] t-3 uppercase tracking-wide mb-1">Investing</div>
          <div className="text-[15px] font-bold text-orange-500">{fmtCurrency(totalDeployed, 0)}</div>
          <div className="text-[9px] t-3">{fmtCurrency(monthlyBudget, 0)} × {months} months</div>
        </div>
        {/* Breakeven change */}
        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] t-3 uppercase tracking-wide mb-1">Breakeven</div>
          <div className="flex items-center gap-2">
            <span className={`text-[15px] font-bold ${holdBE > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {holdBE > 0 ? `+${holdBE.toFixed(1)}%` : '✓'}
            </span>
            <span className="text-[12px] t-3">→</span>
            <span className="text-[15px] font-bold text-emerald-500">
              {afterBE > 0 ? `+${afterBE.toFixed(1)}%` : '✓'}
            </span>
          </div>
          {ppSaved > 0.1
            ? <div className="text-[9px] font-semibold text-emerald-500 mt-0.5">{ppSaved.toFixed(1)}% easier to recover</div>
            : <div className="text-[9px] t-3 mt-0.5">no change</div>
          }
        </div>
      </div>

      {/* Per-asset card rows */}
      <div className="px-3 py-3 space-y-1.5">
        {schedule.map(({ asset, newAvg, gainBefore, gainAfter, improvement, monthlyBudget: mb, drawdownPct }) => (
          <div key={asset.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>

            {/* Avatar */}
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
              {asset.symbol.slice(0, 1)}
            </div>

            {/* Symbol + drawdown */}
            <div className="min-w-[64px]">
              <div className="text-[12px] font-semibold t-1 leading-tight">{asset.symbol}</div>
              <div className={`text-[10px] font-medium ${drawdownPct < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {drawdownPct >= 0 ? '+' : ''}{drawdownPct.toFixed(1)}%
              </div>
            </div>

            {/* Budget */}
            <div className="min-w-[52px]">
              <div className="text-[10px] t-3">Budget</div>
              <div className="text-[11px] font-semibold t-1">{fmtCurrency(mb, 0)}<span className="text-[9px] t-3">/mo</span></div>
            </div>

            {/* Avg entry: now dimmed → after bold green */}
            <div className="flex-1">
              <div className="text-[10px] t-3 mb-0.5">Avg entry</div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] t-3 line-through opacity-50">{fmtCurrency(asset.entryPrice)}</span>
                <span className="text-[10px] t-3">→</span>
                <span className="text-[12px] font-bold text-emerald-500">{fmtCurrency(newAvg)}</span>
              </div>
            </div>

            {/* Breakeven: now (red pill) → after (green pill) + improvement badge */}
            <div className="text-right">
              <div className="text-[10px] t-3 mb-0.5">Breakeven</div>
              <div className="flex items-center justify-end gap-1">
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${gainBefore > 0 ? 'text-red-500' : 'text-emerald-500'}`}
                  style={{ background: gainBefore > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }}>
                  {gainBefore > 0 ? `+${gainBefore.toFixed(1)}%` : '✓'}
                </span>
                <span className="text-[10px] t-3">→</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-md font-bold text-emerald-600"
                  style={{ background: 'rgba(34,197,94,0.12)' }}>
                  {gainAfter > 0 ? `+${gainAfter.toFixed(1)}%` : '✓'}
                </span>
              </div>
              {improvement > 0.1 && (
                <span className="inline-block text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 rounded-full mt-0.5"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  −{improvement.toFixed(1)}pp easier
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

    </GlassCard>
  );
}

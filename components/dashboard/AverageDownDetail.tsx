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

  /* ── Weights ── */
  const weights = useMemo(() => {
    if (assets.length === 0) return {};
    if (distribution === 'equal') return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    const losses = assets.map((a) => ({ id: a.id, loss: Math.max(0, ((a.entryPrice - a.currentPrice) / a.entryPrice) * 100) }));
    const total  = losses.reduce((s, d) => s + d.loss, 0);
    if (total === 0) return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    return Object.fromEntries(losses.map((d) => [d.id, d.loss / total]));
  }, [assets, distribution]);

  /* ── Per-asset schedule ── */
  const schedule = useMemo(() => assets.map((asset) => {
    const mb      = monthlyBudget * (weights[asset.id] ?? 1 / Math.max(assets.length, 1));
    const totalD  = mb * months;

    // Month-by-month snapshots
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

    const newAvg     = monthly[monthly.length - 1]?.avgEntry ?? asset.entryPrice;
    const gainBefore = asset.currentPrice > 0 ? Math.max(0, (asset.entryPrice / asset.currentPrice - 1) * 100) : 0;
    const gainAfter  = monthly[monthly.length - 1]?.gainNeeded ?? gainBefore;
    const improvement = gainBefore - gainAfter;
    const coinsAdded  = asset.currentPrice > 0 ? totalD / asset.currentPrice : 0;
    const drawdownPct = asset.entryPrice > 0 ? ((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100 : 0;

    return { asset, mb, totalD, newAvg, gainBefore, gainAfter, improvement, coinsAdded, drawdownPct, monthly };
  }), [assets, monthlyBudget, months, weights]);

  /* ── Portfolio totals ── */
  const totalDeployed    = monthlyBudget * months;
  const holdBE           = stats.totalValue > 0 ? Math.max(0, (stats.totalInvested / stats.totalValue - 1) * 100) : 0;
  const newTotalInvested = stats.totalInvested + totalDeployed;
  const newTotalValue    = stats.totalValue + totalDeployed;
  const afterBE          = newTotalValue > 0 ? Math.max(0, (newTotalInvested / newTotalValue - 1) * 100) : 0;
  const ppSaved          = holdBE - afterBE;

  if (assets.length === 0) return null;

  return (
    <div className="space-y-4">

      {/* ── Controls ── */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs t-3 font-medium whitespace-nowrap">Duration</span>
          <div className="flex gap-1">
            {[3, 6, 12].map((m) => (
              <button key={m} onClick={() => setMonths(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${months === m ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${months === m ? '#f97316' : 'var(--border)'}` }}>
                {m}mo
              </button>
            ))}
          </div>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          <span className="text-xs t-3 font-medium whitespace-nowrap">Distribute by</span>
          <div className="flex gap-1">
            {(['equal', 'drawdown'] as const).map((d) => (
              <button key={d} onClick={() => setDistribution(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${distribution === d ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ border: `1px solid ${distribution === d ? '#f97316' : 'var(--border)'}` }}>
                {d === 'equal' ? 'Equal Split' : 'By Loss Size'}
              </button>
            ))}
          </div>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
            <span className="text-xs t-3 whitespace-nowrap">Monthly budget</span>
            <input type="range" min={50} max={5000} step={50} value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #f97316 ${(monthlyBudget / 5000) * 100}%, var(--border-strong) ${(monthlyBudget / 5000) * 100}%)`, touchAction: 'none' }} />
            <span className="text-sm font-bold text-orange-500 whitespace-nowrap w-16 text-right">{fmtCurrency(monthlyBudget, 0)}/mo</span>
          </div>
        </div>
      </GlassCard>

      {/* ── Portfolio summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Monthly budget',    value: fmtCurrency(monthlyBudget, 0),  sub: 'per month',             color: 'text-orange-500' },
          { label: 'Total deploying',   value: fmtCurrency(totalDeployed, 0),  sub: `over ${months} months`, color: 'text-orange-500' },
          { label: 'Breakeven now',     value: holdBE > 0 ? `+${holdBE.toFixed(1)}%` : '✓ In profit', sub: 'hold only', color: holdBE > 0 ? 'text-red-500' : 'text-emerald-500' },
          { label: 'Breakeven after',   value: afterBE > 0 ? `+${afterBE.toFixed(1)}%` : '✓ In profit', sub: 'after full plan', color: afterBE > 0 ? 'text-emerald-500' : 'text-emerald-500' },
          { label: 'Improvement',       value: ppSaved > 0 ? `−${ppSaved.toFixed(1)}pp` : '—', sub: 'easier to break even', color: 'text-emerald-500' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4" hover>
            <div className="text-[11px] t-3 mb-1">{s.label}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] t-3 mt-0.5">{s.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── Per-asset detailed table ── */}
      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold t-1">Per-Asset Plan</h2>
          <p className="text-xs t-3 mt-0.5">How each position improves with your {months}-month average-down plan</p>
        </div>
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Asset', 'Drawdown', 'Monthly', 'Total', 'Avg Entry', 'Breakeven', 'Improvement'].map(h => (
                <th key={h} className="text-left text-[11px] t-3 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map(({ asset, mb, totalD, newAvg, gainBefore, gainAfter, improvement, coinsAdded, drawdownPct }) => (
              <tr key={asset.id} className="table-row-hover transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                {/* Asset */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                      {asset.symbol.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold t-1">{asset.symbol}</div>
                      <div className="text-[10px] t-3 truncate">{asset.name}</div>
                    </div>
                  </div>
                </td>
                {/* Drawdown */}
                <td className="px-4 py-3.5">
                  <div className={`text-[13px] font-semibold ${drawdownPct < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {drawdownPct >= 0 ? '+' : ''}{drawdownPct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] t-3 mt-0.5">{fmtCurrency(asset.currentPrice)}</div>
                </td>
                {/* Monthly */}
                <td className="px-4 py-3.5">
                  <div className="text-[13px] font-semibold t-1">{fmtCurrency(mb, 0)}</div>
                  <div className="text-[10px] t-3 mt-0.5">per month</div>
                </td>
                {/* Total */}
                <td className="px-4 py-3.5">
                  <div className="text-[13px] font-semibold t-1">{fmtCurrency(totalD, 0)}</div>
                  <div className="text-[10px] t-3 mt-0.5">+{fmtNumber(coinsAdded, coinsAdded < 1 ? 4 : 2)} {asset.symbol}</div>
                </td>
                {/* Avg entry */}
                <td className="px-4 py-3.5">
                  <div className="text-[11px] t-3">Before</div>
                  <div className="text-[12px] font-medium t-2">{fmtCurrency(asset.entryPrice)}</div>
                  <div className="text-[11px] t-3 mt-1">After</div>
                  <div className="text-[12px] font-bold text-emerald-500">{fmtCurrency(newAvg)}</div>
                </td>
                {/* Breakeven */}
                <td className="px-4 py-3.5">
                  <div className="text-[11px] t-3">Before</div>
                  <div className={`text-[12px] font-medium ${gainBefore > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {gainBefore > 0 ? `+${gainBefore.toFixed(1)}%` : '✓ Profit'}
                  </div>
                  <div className="text-[11px] t-3 mt-1">After</div>
                  <div className={`text-[12px] font-bold ${gainAfter > 0 ? 'text-emerald-600' : 'text-emerald-500'}`}>
                    {gainAfter > 0 ? `+${gainAfter.toFixed(1)}%` : '✓ Profit'}
                  </div>
                </td>
                {/* Improvement */}
                <td className="px-4 py-3.5">
                  {improvement > 0.1 ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <span className="text-[12px] font-bold text-emerald-500">−{improvement.toFixed(1)}pp</span>
                    </div>
                  ) : (
                    <span className="text-[11px] t-3">—</span>
                  )}
                  <div className="text-[10px] t-3 mt-1.5">easier to break even</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* ── Month-by-month schedule ── */}
      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold t-1">Month-by-Month Schedule</h2>
          <p className="text-xs t-3 mt-0.5">Exactly what to buy each month and the running effect on your average entry</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left text-[11px] t-3 font-medium px-4 py-3 whitespace-nowrap">Asset</th>
                {Array.from({ length: months }, (_, i) => (
                  <th key={i} className="text-left text-[11px] t-3 font-medium px-4 py-3 whitespace-nowrap">Month {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map(({ asset, monthly, mb }) => (
                <tr key={asset.id} className="table-row-hover transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Asset name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                        {asset.symbol.slice(0, 1)}
                      </div>
                      <span className="text-xs font-semibold t-1">{asset.symbol}</span>
                    </div>
                  </td>
                  {/* Per month cells */}
                  {monthly.map((m) => (
                    <td key={m.month} className="px-4 py-3">
                      <div className="text-xs font-semibold t-1">{fmtCurrency(m.buy, 0)}</div>
                      <div className="text-[10px] t-3 mt-0.5">avg {fmtCurrency(m.avgEntry)}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${m.gainNeeded > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {m.gainNeeded > 0 ? `+${m.gainNeeded.toFixed(1)}% to BE` : '✓ Profit'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {/* Monthly total row */}
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-3 text-[11px] t-3 font-medium">Total/mo</td>
                {Array.from({ length: months }, (_, i) => (
                  <td key={i} className="px-4 py-3">
                    <div className="text-xs font-bold text-orange-500">{fmtCurrency(monthlyBudget, 0)}</div>
                    <div className="text-[10px] t-3 mt-0.5">cumul. {fmtCurrency(monthlyBudget * (i + 1), 0)}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

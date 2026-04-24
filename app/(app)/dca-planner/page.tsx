'use client';
import { useState, useMemo } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { usePortfolioRefresh } from '@/lib/usePortfolioRefresh';
import { calcPortfolioStats, fmtCurrency } from '@/lib/calculations';

export default function DCAPlanner() {
  const { portfolio, refreshing, lastUpdated, refresh } = usePortfolioRefresh();
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [months, setMonths] = useState(6);
  const [distribution, setDistribution] = useState<'equal' | 'drawdown'>('drawdown');

  if (!portfolio) return <div className="t-3 p-8">Loading…</div>;
  if (portfolio.assets.length === 0) {
    return (
      <>
        <Header title="DCA Planner" subtitle="Build your buy schedule" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
        <GlassCard className="p-8 text-center"><p className="t-3 text-sm">Add assets to your portfolio first.</p></GlassCard>
      </>
    );
  }

  const assets = portfolio.assets;
  const stats = calcPortfolioStats(assets);
  const totalInvested = stats.totalInvested;
  const totalValue = stats.totalValue;
  const holdBreakevenReq = totalValue > 0 ? (totalInvested / totalValue - 1) * 100 : 0;

  /* ── Weights ─────────────────────────────────────────────────── */
  const weights = useMemo(() => {
    if (distribution === 'equal') {
      return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    }
    const losses = assets.map((a) => ({
      id: a.id,
      loss: Math.max(0, ((a.entryPrice - a.currentPrice) / a.entryPrice) * 100),
    }));
    const total = losses.reduce((s, d) => s + d.loss, 0);
    if (total === 0) return Object.fromEntries(assets.map((a) => [a.id, 1 / assets.length]));
    return Object.fromEntries(losses.map((d) => [d.id, d.loss / total]));
  }, [assets, distribution]);

  /* ── Per-asset monthly schedule ─────────────────────────────── */
  const schedule = useMemo(() =>
    assets.map((asset) => {
      const budget = monthlyBudget * (weights[asset.id] ?? 1 / assets.length);
      let cumTokens = asset.amount;
      let cumCost = asset.entryPrice * asset.amount;

      const rows = Array.from({ length: months }, (_, i) => {
        const newTokens = asset.currentPrice > 0 ? budget / asset.currentPrice : 0;
        cumTokens += newTokens;
        cumCost += budget;
        const newAvg = cumTokens > 0 ? cumCost / cumTokens : 0;
        const gainNeeded = asset.currentPrice > 0 ? Math.max(0, (newAvg / asset.currentPrice - 1) * 100) : 0;
        return { month: i + 1, budget, newTokens, cumTokens, cumCost, newAvg, gainNeeded };
      });
      const last = rows[rows.length - 1];
      const gainBefore = asset.currentPrice > 0 ? Math.max(0, (asset.entryPrice / asset.currentPrice - 1) * 100) : 0;
      const improvement = gainBefore - last.gainNeeded;
      return { asset, rows, gainBefore, gainAfter: last.gainNeeded, improvement, totalDeployed: budget * months };
    }), [assets, monthlyBudget, months, weights]);

  /* ── Portfolio summary ───────────────────────────────────────── */
  const totalDeployed = monthlyBudget * months;
  const newTotalInvested = totalInvested + totalDeployed;
  const newTotalValue = totalValue + totalDeployed; // buying at current price
  const newBreakevenReq = newTotalValue > 0 ? Math.max(0, (newTotalInvested / newTotalValue - 1) * 100) : 0;
  const improvement = holdBreakevenReq - newBreakevenReq;

  return (
    <>
      <Header title="DCA Planner" subtitle="Your month-by-month buy schedule" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />

      {/* ── Settings ────────────────────────────────────────────── */}
      <GlassCard className="p-5 mb-4">
        <h2 className="text-sm font-semibold t-1 mb-4">Plan Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Monthly budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs t-3">Monthly budget</span>
              <span className="text-sm font-bold text-orange-500">{fmtCurrency(monthlyBudget, 0)}</span>
            </div>
            <input type="range" min={50} max={5000} step={50} value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #f97316 ${(monthlyBudget / 5000) * 100}%, var(--border-strong) ${(monthlyBudget / 5000) * 100}%)`, touchAction: 'none' }} />
            <div className="flex justify-between text-[10px] t-3 mt-1"><span>$50</span><span>$2.5k</span><span>$5k</span></div>
          </div>

          {/* Duration */}
          <div>
            <div className="text-xs t-3 mb-2">Duration</div>
            <div className="flex gap-2">
              {[3, 6, 12].map((m) => (
                <button key={m} onClick={() => setMonths(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${months === m ? 'bg-orange-500 text-white' : 'text-t-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  style={{ border: `1px solid ${months === m ? '#f97316' : 'var(--border)'}` }}>
                  {m}mo
                </button>
              ))}
            </div>
          </div>

          {/* Distribution */}
          <div>
            <div className="text-xs t-3 mb-2">Allocation method</div>
            <div className="flex gap-2">
              {(['equal', 'drawdown'] as const).map((d) => (
                <button key={d} onClick={() => setDistribution(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${distribution === d ? 'bg-orange-500 text-white' : 't-2 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  style={{ border: `1px solid ${distribution === d ? '#f97316' : 'var(--border)'}` }}>
                  {d === 'equal' ? 'Equal' : 'By Loss'}
                </button>
              ))}
            </div>
            <div className="text-[10px] t-3 mt-1.5">
              {distribution === 'drawdown' ? '↑ More budget toward worst-hit assets' : '↑ Split evenly across all assets'}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Portfolio summary impact ─────────────────────────────── */}
      <GlassCard className="p-5 mb-4" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
        <h2 className="text-sm font-semibold t-1 mb-3">Plan Impact Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] t-3 mb-1">Total to deploy</div>
            <div className="text-base font-bold text-orange-500">{fmtCurrency(totalDeployed)}</div>
            <div className="text-[10px] t-3">{fmtCurrency(monthlyBudget, 0)}/mo × {months}mo</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] t-3 mb-1">Breakeven now</div>
            <div className="text-base font-bold text-red-500">+{holdBreakevenReq.toFixed(1)}%</div>
            <div className="text-[10px] t-3">hold only, no new capital</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] t-3 mb-1">After plan</div>
            <div className="text-base font-bold text-emerald-500">+{newBreakevenReq.toFixed(1)}%</div>
            <div className="text-[10px] t-3">new portfolio breakeven</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="text-[10px] t-3 mb-1">Recovery reduced by</div>
            <div className="text-base font-bold text-emerald-500">−{improvement.toFixed(1)}pp</div>
            <div className="text-[10px] text-emerald-500">{improvement > 0 ? 'real improvement' : 'no change'}</div>
          </div>
        </div>
      </GlassCard>

      {/* ── Per-asset schedules ───────────────────────────────────── */}
      <div className="space-y-4">
        {schedule.map(({ asset, rows, gainBefore, gainAfter, improvement: imp, totalDeployed: td }) => (
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
                    Entry {fmtCurrency(asset.entryPrice)} · Now {fmtCurrency(asset.currentPrice)} · {fmtCurrency(td, 0)} to deploy
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] t-3">Breakeven need</div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-sm font-bold text-red-500">+{gainBefore.toFixed(1)}%</span>
                  <span className="text-xs t-3">→</span>
                  <span className="text-sm font-bold text-emerald-500">+{gainAfter.toFixed(1)}%</span>
                </div>
                {imp > 0 && <div className="text-[10px] text-emerald-500">−{imp.toFixed(1)}pp improvement</div>}
              </div>
            </div>

            {/* Mobile card rows */}
            <div className="md:hidden space-y-2">
              {rows.map((r) => (
                <div key={r.month} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold t-3"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    M{r.month}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold t-1">Buy {fmtCurrency(r.budget, 0)}</span>
                      <span className="text-xs font-semibold t-1">{fmtCurrency(r.newAvg)} avg</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-[10px] t-3">+{r.newTokens.toFixed(4)} tokens</span>
                      <span className="text-[10px] text-emerald-500 font-medium">Need +{r.gainNeeded.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Month', 'Deploy $', 'Tokens Bought', 'Cumulative Tokens', 'New Avg Entry', 'Breakeven Need'].map((h) => (
                      <th key={h} className="text-left text-[11px] t-3 font-medium px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.month} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-2.5 text-xs font-semibold t-2">Month {r.month}</td>
                      <td className="px-3 py-2.5 text-xs t-1 font-medium text-orange-500">{fmtCurrency(r.budget, 0)}</td>
                      <td className="px-3 py-2.5 text-xs t-2">+{r.newTokens.toFixed(4)}</td>
                      <td className="px-3 py-2.5 text-xs t-2">{r.cumTokens.toFixed(4)}</td>
                      <td className="px-3 py-2.5 text-xs t-1 font-semibold">{fmtCurrency(r.newAvg)}</td>
                      <td className="px-3 py-2.5 text-xs font-bold text-emerald-500">+{r.gainNeeded.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] t-3 text-center mt-4">
        Assumes buys at current live price each month. Actual prices will vary. This is a planning tool only.
      </p>
    </>
  );
}

'use client';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { savePortfolio } from '@/lib/storage';
import { generateStrategyResult } from '@/lib/strategies';
import { calcBreakevenMove, fmtCurrency, fmtPercent } from '@/lib/calculations';
import { usePortfolioRefresh } from '@/lib/usePortfolioRefresh';

export default function StrategiesPage() {
  const { portfolio, refreshing, lastUpdated, refresh } = usePortfolioRefresh();

  useEffect(() => { if (portfolio) savePortfolio(portfolio); }, [portfolio]);

  if (!portfolio) return <div className="t-3 p-8">Loading...</div>;

  const result = generateStrategyResult(portfolio.assets, portfolio.strategy, portfolio.riskMode, portfolio.hedgeRatio);

  const actionColor: Record<string, string> = {
    hold: 'text-blue-500', dca: 'text-emerald-600', hedge: 'text-indigo-500',
    reduce: 'text-orange-500', reassess: 'text-amber-600',
  };

  const actionBg: Record<string, string> = {
    hold: 'rgba(59,130,246,0.08)', dca: 'rgba(34,197,94,0.08)', hedge: 'rgba(99,102,241,0.08)',
    reduce: 'rgba(249,115,22,0.08)', reassess: 'rgba(245,158,11,0.08)',
  };

  const actionBorder: Record<string, string> = {
    hold: 'rgba(59,130,246,0.2)', dca: 'rgba(34,197,94,0.2)', hedge: 'rgba(99,102,241,0.2)',
    reduce: 'rgba(249,115,22,0.2)', reassess: 'rgba(245,158,11,0.2)',
  };

  return (
    <>
      <Header title="Strategies" subtitle="Rule-based recovery actions for your portfolio" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />

      {/* Active strategy banner */}
      <GlassCard className="p-5 mb-4" style={{ border: '1px solid rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.04)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] t-3 uppercase tracking-wider mb-1">Active Strategy</div>
            <div className="text-lg font-bold t-1">{result.name}</div>
            <div className="text-xs t-3 mt-1 leading-relaxed max-w-xl">{result.description}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] t-3 mb-1">Hedge Status</div>
            <div className="text-sm font-semibold text-orange-500">{result.hedgeStatus}</div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action steps */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold t-1 mb-4">Action Steps</h2>
          <div className="space-y-2.5">
            {result.actions.map((action) => (
              <div key={action.order} className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: actionBg[action.type] ?? 'var(--surface-deep)', border: `1px solid ${actionBorder[action.type] ?? 'var(--border)'}` }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--border-strong)' }}>
                  {action.order}
                </span>
                <div>
                  <div className={`text-sm font-semibold ${actionColor[action.type]}`}>{action.title}</div>
                  <div className="text-xs t-3 mt-0.5 leading-relaxed">{action.description}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Per-asset breakeven */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold t-1 mb-4">Per-Asset Breakeven</h2>
          <div className="space-y-2">
            {portfolio.assets.map((asset) => {
              const move = calcBreakevenMove(asset);
              const pnlPct = ((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100;
              const isProfit = move <= 0;
              const pct = Math.min(Math.abs(pnlPct), 100);
              return (
                <div key={asset.id} className="p-3.5 rounded-xl" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: asset.color + '33', border: `1px solid ${asset.color}55`, color: asset.color }}>
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold t-1">{asset.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold tabular-nums ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                        {fmtPercent(pnlPct)}
                      </div>
                      <div className="text-[10px] t-3">{fmtCurrency(asset.entryPrice)} → {fmtCurrency(asset.currentPrice)}</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: isProfit ? '#22c55e' : '#ef4444' }} />
                  </div>
                  <div className="mt-1.5">
                    <span className={`text-[11px] font-semibold ${isProfit ? 'text-emerald-500' : 'text-orange-500'}`}>
                      {isProfit ? '✓ Already recovered' : `Needs +${Math.abs(move).toFixed(2)}% to break even`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

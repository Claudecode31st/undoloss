'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio, savePortfolio } from '@/lib/storage';
import { generateStrategyResult } from '@/lib/strategies';
import { calcBreakevenMove, fmtCurrency, fmtPercent } from '@/lib/calculations';
import { Portfolio, StrategyMode, RiskMode } from '@/lib/types';
import StrategyModeComponent from '@/components/dashboard/StrategyMode';

export default function StrategiesPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);
  useEffect(() => { if (portfolio) savePortfolio(portfolio); }, [portfolio]);

  if (!portfolio) return <div className="t-3 p-8">Loading...</div>;

  const result = generateStrategyResult(portfolio.assets, portfolio.strategy, portfolio.riskMode, portfolio.hedgeRatio);

  const actionColor: Record<string, string> = {
    hold: 'text-blue-500', dca: 'text-emerald-600', hedge: 'text-indigo-500',
    reduce: 'text-orange-500', reassess: 't-2',
  };

  return (
    <>
      <Header title="Strategies" subtitle="Rule-based recovery strategies for your portfolio" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <StrategyModeComponent
            strategy={portfolio.strategy}
            riskMode={portfolio.riskMode}
            onStrategyChange={(s: StrategyMode) => setPortfolio((p) => p ? { ...p, strategy: s } : p)}
            onRiskModeChange={(r: RiskMode) => setPortfolio((p) => p ? { ...p, riskMode: r } : p)}
          />
        </div>

        <div className="col-span-2 space-y-4">
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-1">{result.name}</h2>
            <p className="text-xs t-3 mb-4">{result.description}</p>
            <div className="space-y-3">
              {result.actions.map((action) => (
                <div key={action.order} className="flex items-start gap-3 p-3 glass-dark rounded-xl">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--border-strong)' }}>
                    {action.order}
                  </span>
                  <div>
                    <div className={`text-sm font-semibold ${actionColor[action.type]}`}>{action.title}</div>
                    <div className="text-xs t-3 mt-0.5">{action.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-4">Per-Asset Breakeven Analysis</h2>
            <div className="space-y-2">
              {portfolio.assets.map((asset) => {
                const move = calcBreakevenMove(asset);
                const pnlPct = ((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100;
                const isProfit = move <= 0;
                return (
                  <div key={asset.id} className="flex items-center gap-3 p-3 glass-dark rounded-xl">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: asset.color + '33', border: `1px solid ${asset.color}55`, color: asset.color }}>
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Row 1: symbol + current P/L */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold t-1">{asset.symbol}</span>
                        <span className={`text-sm font-bold tabular-nums ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                          {fmtPercent(pnlPct)}
                        </span>
                      </div>
                      {/* Row 2: need to recover + prices */}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-orange-500 whitespace-nowrap">
                          {isProfit ? 'Already recovered' : `Need +${Math.abs(move).toFixed(2)}%`}
                        </span>
                        <span className="text-[10px] t-3 tabular-nums whitespace-nowrap">
                          {fmtCurrency(asset.entryPrice)} → {fmtCurrency(asset.currentPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

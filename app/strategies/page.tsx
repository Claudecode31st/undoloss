'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio, savePortfolio } from '@/lib/storage';
import { generateStrategyResult } from '@/lib/strategies';
import { calcPortfolioStats, calcBreakevenMove, fmtCurrency, fmtPercent } from '@/lib/calculations';
import { Portfolio, StrategyMode, RiskMode } from '@/lib/types';
import StrategyModeComponent from '@/components/dashboard/StrategyMode';

export default function StrategiesPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);
  useEffect(() => { if (portfolio) savePortfolio(portfolio); }, [portfolio]);

  if (!portfolio) return <div className="text-zinc-500 p-8">Loading...</div>;

  const result = generateStrategyResult(portfolio.assets, portfolio.strategy, portfolio.riskMode, portfolio.hedgeRatio);
  const stats = calcPortfolioStats(portfolio.assets);

  const actionColor = { hold: 'text-blue-400', dca: 'text-emerald-400', hedge: 'text-indigo-400', reduce: 'text-orange-400', reassess: 'text-zinc-300' };

  return (
    <>
      <Header title="Strategies" subtitle="Rule-based recovery strategies for your portfolio" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-3 gap-4">
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
            <h2 className="text-sm font-semibold text-white mb-1">{result.name}</h2>
            <p className="text-xs text-zinc-500 mb-4">{result.description}</p>

            <div className="space-y-3">
              {result.actions.map((action) => (
                <div key={action.order} className="flex items-start gap-3 p-3 glass-dark rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                    {action.order}
                  </span>
                  <div>
                    <div className={`text-sm font-semibold ${actionColor[action.type]}`}>{action.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{action.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Per-asset breakeven */}
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Per-Asset Breakeven Analysis</h2>
            <div className="space-y-2">
              {portfolio.assets.map((asset) => {
                const move = calcBreakevenMove(asset);
                return (
                  <div key={asset.id} className="flex items-center gap-3 p-3 glass-dark rounded-xl">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: asset.color + '33', border: `1px solid ${asset.color}55` }}>
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-white">{asset.symbol}</span>
                        <span className="text-sm font-semibold text-orange-400">Need +{Math.abs(move).toFixed(2)}%</span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        Entry: {fmtCurrency(asset.entryPrice)} → Current: {fmtCurrency(asset.currentPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${move <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmtPercent(((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100)}
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

'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import RecoveryPlanCard from '@/components/dashboard/RecoveryPlanCard';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio, savePortfolio } from '@/lib/storage';
import { generateStrategyResult } from '@/lib/strategies';
import { calcPortfolioStats, calcRiskScore, fmtCurrency, fmtPercent } from '@/lib/calculations';
import { Portfolio } from '@/lib/types';

export default function RecoveryPlanPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);
  useEffect(() => { if (portfolio) savePortfolio(portfolio); }, [portfolio]);

  if (!portfolio) return <div className="text-zinc-500 p-8">Loading...</div>;

  const result = generateStrategyResult(portfolio.assets, portfolio.strategy, portfolio.riskMode, portfolio.hedgeRatio);
  const stats = calcPortfolioStats(portfolio.assets);
  const risk = calcRiskScore(portfolio.assets);
  const breakevenMove = stats.totalValue > 0 ? ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100 : 0;

  return (
    <>
      <Header title="Recovery Plan" subtitle="Your personalized recovery roadmap" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-3 gap-4">
        {/* Summary */}
        <div className="col-span-1 space-y-3">
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Recovery Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Current Value</span>
                <span className="text-sm font-semibold text-white">{fmtCurrency(stats.totalValue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Invested</span>
                <span className="text-sm font-semibold text-white">{fmtCurrency(stats.totalInvested)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Unrealized Loss</span>
                <span className="text-sm font-semibold text-red-400">{fmtCurrency(stats.totalUnrealizedPnL)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Required Move</span>
                <span className="text-sm font-semibold text-orange-400">+{Math.abs(breakevenMove).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-zinc-500">Risk Level</span>
                <span className={`text-sm font-semibold ${risk.score > 65 ? 'text-red-400' : risk.score > 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {risk.level}
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">Strategy Active</div>
            <div className="text-sm font-semibold text-orange-300">{result.name}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{result.description}</div>
          </GlassCard>
        </div>

        <div className="col-span-2">
          <RecoveryPlanCard
            result={result}
            hedgeRatio={portfolio.hedgeRatio}
            onHedgeChange={(ratio) => setPortfolio((p) => p ? { ...p, hedgeRatio: ratio } : p)}
          />
        </div>
      </div>
    </>
  );
}

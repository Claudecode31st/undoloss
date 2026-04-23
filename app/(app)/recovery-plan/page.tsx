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

  if (!portfolio) return <div className="t-3 p-8">Loading...</div>;

  const result = generateStrategyResult(portfolio.assets, portfolio.strategy, portfolio.riskMode, portfolio.hedgeRatio);
  const stats = calcPortfolioStats(portfolio.assets);
  const risk = calcRiskScore(portfolio.assets);
  const breakevenMove = stats.totalValue > 0 ? ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100 : 0;

  return (
    <>
      <Header title="Recovery Plan" subtitle="Your personalized recovery roadmap" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 space-y-3">
          <GlassCard className="p-5">
            <h2 className="text-sm font-semibold t-1 mb-4">Recovery Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Current Value', value: fmtCurrency(stats.totalValue), cls: 't-1' },
                { label: 'Invested', value: fmtCurrency(stats.totalInvested), cls: 't-1' },
                { label: 'Unrealized Loss', value: fmtCurrency(stats.totalUnrealizedPnL), cls: 'text-red-500' },
                { label: 'Required Move', value: `+${Math.abs(breakevenMove).toFixed(2)}%`, cls: 'text-orange-500' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs t-3">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.cls}`}>{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <span className="text-xs t-3">Risk Level</span>
                <span className={`text-sm font-semibold ${risk.score > 65 ? 'text-red-500' : risk.score > 40 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                  {risk.level}
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-xs t-3 mb-2 font-medium uppercase tracking-wide">Strategy Active</div>
            <div className="text-sm font-semibold text-orange-500">{result.name}</div>
            <div className="text-xs t-3 mt-0.5">{result.description}</div>
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

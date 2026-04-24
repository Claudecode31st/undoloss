'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio } from '@/lib/storage';
import { calcPortfolioStats, calcRiskScore, calcAllocation, fmtCurrency, fmtPercent } from '@/lib/calculations';
import { Portfolio } from '@/lib/types';

export default function RiskDashboardPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);
  if (!portfolio) return <div className="t-3 text-sm p-8">Loading...</div>;

  const stats = calcPortfolioStats(portfolio.assets);
  const risk = calcRiskScore(portfolio.assets);
  const allocation = calcAllocation(portfolio.assets);

  const riskColor = risk.score < 30 ? '#22c55e' : risk.score < 55 ? '#eab308' : risk.score < 75 ? '#f97316' : '#ef4444';
  const riskAngle = (risk.score / 100) * 180;

  const metrics = [
    { label: 'Drawdown Score', value: risk.drawdownScore.toFixed(1), max: 40, color: '#ef4444', desc: 'Based on unrealized loss vs invested' },
    { label: 'Concentration Score', value: risk.concentrationScore.toFixed(1), max: 35, color: '#f97316', desc: 'Top 2 assets concentration' },
    { label: 'Diversification Score', value: risk.exposureScore.toFixed(1), max: 25, color: '#6366f1', desc: 'Number of positions held' },
  ];

  return (
    <>
      <Header title="Risk Dashboard" subtitle="Portfolio risk analysis and monitoring" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <GlassCard className="p-6 flex flex-col items-center col-span-1">
          <h2 className="text-sm font-semibold t-1 mb-4">Overall Risk Score</h2>
          <div className="w-48 h-28">
            <svg viewBox="0 0 160 80" className="w-full h-full">
              <path d="M10 75 A 70 70 0 0 1 150 75" fill="none" stroke="var(--border-strong)" strokeWidth="12" strokeLinecap="round" />
              <path d="M10 75 A 70 70 0 0 1 150 75" fill="none" stroke={riskColor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${(riskAngle / 180) * 220} 220`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
              <text x="80" y="68" textAnchor="middle" style={{ fill: 'var(--text-1)', fontSize: '22px', fontWeight: 'bold' }}>{risk.score}</text>
            </svg>
          </div>
          <div className="text-base font-bold mt-2" style={{ color: riskColor }}>{risk.level}</div>
          <div className="text-xs t-3 mt-1">Portfolio Risk Assessment</div>
        </GlassCard>

        <GlassCard className="p-5 col-span-2">
          <h2 className="text-sm font-semibold t-1 mb-4">Risk Breakdown</h2>
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs t-2">{m.label}</span>
                  <span className="text-xs font-semibold t-1">{m.value} / {m.max}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-strong)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(parseFloat(m.value) / m.max) * 100}%`, backgroundColor: m.color }} />
                </div>
                <div className="text-[10px] t-3 mt-0.5">{m.desc}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold t-1 mb-4">Asset Concentration</h2>
          <div className="space-y-2">
            {allocation.filter(a => a.symbol !== 'Others').map((item) => (
              <div key={item.symbol} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: item.color + '33', border: `1px solid ${item.color}44` }}>
                  <span style={{ color: item.color }}>{item.symbol.slice(0, 2)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs t-2">{item.symbol}</span>
                    <span className="text-xs font-semibold t-1">{item.percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-strong)' }}>
                    <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-4 px-3 py-2 rounded-lg border text-xs font-medium ${
            risk.concentrationRisk === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            risk.concentrationRisk === 'Moderate' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600' :
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
          }`}>
            Concentration Risk: {risk.concentrationRisk} — Top 2 assets: {risk.top2AssetsPercent.toFixed(1)}%
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold t-1 mb-4">Key Risk Metrics</h2>
          <div className="space-y-3">
            {[
              { label: 'Current Drawdown', value: fmtPercent(Math.min(stats.totalUnrealizedPnLPercent, 0)), color: 'text-red-500' },
              { label: 'Capital at Risk', value: fmtCurrency(Math.abs(Math.min(stats.totalUnrealizedPnL, 0))), color: 'text-red-500' },
              { label: 'Breakeven Required', value: `+${Math.max(0, ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100).toFixed(2)}%`, color: 'text-orange-500' },
              { label: 'Total Invested', value: fmtCurrency(stats.totalInvested), color: 't-1' },
              { label: 'Current Value', value: fmtCurrency(stats.totalValue), color: 't-1' },
              { label: 'Positions', value: `${portfolio.assets.length} assets`, color: 't-2' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs t-3">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

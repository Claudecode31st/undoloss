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
  if (!portfolio) return <div className="text-zinc-500 text-sm p-8">Loading...</div>;

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

      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Big gauge */}
        <GlassCard className="p-6 flex flex-col items-center col-span-1">
          <h2 className="text-sm font-semibold text-white mb-4">Overall Risk Score</h2>
          <div className="w-48 h-28">
            <svg viewBox="0 0 160 80" className="w-full h-full">
              <path d="M10 75 A 70 70 0 0 1 150 75" fill="none" stroke="#27272a" strokeWidth="12" strokeLinecap="round" />
              <path d="M10 75 A 70 70 0 0 1 150 75" fill="none" stroke={riskColor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${(riskAngle / 180) * 220} 220`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
              <g transform={`rotate(${riskAngle - 90}, 80, 75)`}>
                <line x1="80" y1="75" x2="80" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="80" cy="75" r="4" fill="white" />
              </g>
              <text x="80" y="65" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{risk.score}</text>
              <text x="80" y="74" textAnchor="middle" fill="#71717a" fontSize="8">/100</text>
            </svg>
          </div>
          <div className="text-base font-bold mt-2" style={{ color: riskColor }}>{risk.level}</div>
          <div className="text-xs text-zinc-500 mt-1">Portfolio Risk Assessment</div>
        </GlassCard>

        {/* Risk components */}
        <GlassCard className="p-5 col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4">Risk Breakdown</h2>
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-zinc-400">{m.label}</span>
                  <span className="text-xs font-semibold text-white">{m.value} / {m.max}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(parseFloat(m.value) / m.max) * 100}%`, backgroundColor: m.color }}
                  />
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{m.desc}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Concentration */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Asset Concentration</h2>
          <div className="space-y-2">
            {allocation.filter(a => a.symbol !== 'Others').map((item) => (
              <div key={item.symbol} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: item.color + '33', border: `1px solid ${item.color}44` }}>
                  {item.symbol.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-zinc-300">{item.symbol}</span>
                    <span className="text-xs font-semibold text-white">{item.percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-4 px-3 py-2 rounded-lg border text-xs font-medium ${
            risk.concentrationRisk === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            risk.concentrationRisk === 'Moderate' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            Concentration Risk: {risk.concentrationRisk} — Top 2 assets: {risk.top2AssetsPercent.toFixed(1)}%
          </div>
        </GlassCard>

        {/* Key risk metrics */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Key Risk Metrics</h2>
          <div className="space-y-3">
            {[
              { label: 'Current Drawdown', value: fmtPercent(Math.min(stats.totalUnrealizedPnLPercent, 0)), color: 'text-red-400' },
              { label: 'Capital at Risk', value: fmtCurrency(Math.abs(Math.min(stats.totalUnrealizedPnL, 0))), color: 'text-red-400' },
              { label: 'Breakeven Required', value: `+${Math.max(0, ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100).toFixed(2)}%`, color: 'text-orange-400' },
              { label: 'Total Invested', value: fmtCurrency(stats.totalInvested), color: 'text-white' },
              { label: 'Current Value', value: fmtCurrency(stats.totalValue), color: 'text-white' },
              { label: 'Positions', value: `${portfolio.assets.length} assets`, color: 'text-zinc-300' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

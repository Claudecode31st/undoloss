'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio } from '@/lib/storage';
import { generateScenarios } from '@/lib/scenarios';
import { calcPortfolioStats, fmtCurrency, fmtPercent } from '@/lib/calculations';
import { Portfolio } from '@/lib/types';

export default function ScenarioSimulatorPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [priceChange, setPriceChange] = useState(0);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);

  if (!portfolio) return <div className="text-zinc-500 p-8">Loading...</div>;

  const stats = calcPortfolioStats(portfolio.assets);
  const scenarios = generateScenarios(portfolio.assets);
  const icons = { bull: TrendingUp, sideways: Minus, bear: TrendingDown };

  // Simulate what-if
  const simulatedValue = stats.totalValue * (1 + priceChange / 100);
  const simulatedPnL = simulatedValue - stats.totalInvested;
  const simulatedPnLPct = stats.totalInvested > 0 ? (simulatedPnL / stats.totalInvested) * 100 : 0;

  return (
    <>
      <Header title="Scenario Simulator" subtitle="Model market conditions and portfolio outcomes" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* What-if simulator */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">What-If Price Simulator</h2>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-zinc-500">Portfolio-wide price change</span>
              <span className={`text-sm font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange}%
              </span>
            </div>
            <input
              type="range" min="-80" max="200" step="5" value={priceChange}
              onChange={(e) => setPriceChange(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${priceChange < 0 ? '#ef4444' : '#22c55e'} ${Math.abs(priceChange) / (priceChange < 0 ? 0.8 : 2) * 100}%, #27272a ${Math.abs(priceChange) / (priceChange < 0 ? 0.8 : 2) * 100}%)`
              }}
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>-80%</span><span>0%</span><span>+200%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-dark rounded-xl p-3">
              <div className="text-[10px] text-zinc-500 mb-1">Simulated Value</div>
              <div className="text-base font-bold text-white">{fmtCurrency(simulatedValue)}</div>
              <div className="text-[10px] text-zinc-500">vs. {fmtCurrency(stats.totalValue)} now</div>
            </div>
            <div className="glass-dark rounded-xl p-3">
              <div className="text-[10px] text-zinc-500 mb-1">Simulated P/L</div>
              <div className={`text-base font-bold ${simulatedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtCurrency(simulatedPnL)}
              </div>
              <div className={`text-[10px] ${simulatedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtPercent(simulatedPnLPct)}
              </div>
            </div>
          </div>

          <button onClick={() => setPriceChange(0)} className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Reset to current
          </button>
        </GlassCard>

        {/* Scenario outcomes */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Market Scenarios</h2>
          <div className="space-y-3">
            {scenarios.map((s) => {
              const Icon = icons[s.scenario];
              const simValue = stats.totalValue * (1 + (s.returnRangeLow + s.returnRangeHigh) / 2 / 100);
              return (
                <div key={s.scenario} className="glass-dark rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={s.color} />
                      <span className="text-sm font-semibold text-white">{s.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${s.color}`}>
                      {s.returnRangeLow >= 0 ? '+' : ''}{s.returnRangeLow}% to +{s.returnRangeHigh}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Est. value: <span className="text-white">{fmtCurrency(simValue)}</span></span>
                    <span>Recovery: {s.recoveryTimeLow}{s.recoveryTimeHigh ? `-${s.recoveryTimeHigh}` : '+'} months</span>
                  </div>
                  <div className="mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s.badgeColor}`}>{s.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Per-asset simulation */}
      <GlassCard className="p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Per-Asset Simulation ({priceChange >= 0 ? '+' : ''}{priceChange}% change)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                {['Asset', 'Current Price', 'Simulated Price', 'Current Value', 'Simulated Value', 'P/L'].map((h) => (
                  <th key={h} className="text-left text-[11px] text-zinc-500 font-medium px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.assets.map((asset) => {
                const simPrice = asset.currentPrice * (1 + priceChange / 100);
                const curValue = asset.currentPrice * asset.amount;
                const simValue = simPrice * asset.amount;
                const pnl = simValue - asset.entryPrice * asset.amount;
                return (
                  <tr key={asset.id} className="table-row-hover border-b border-zinc-800/30">
                    <td className="px-4 py-3 text-sm font-semibold text-white">{asset.symbol}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{fmtCurrency(asset.currentPrice)}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${simPrice >= asset.currentPrice ? 'text-emerald-400' : 'text-red-400'}`}>{fmtCurrency(simPrice)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{fmtCurrency(curValue)}</td>
                    <td className="px-4 py-3 text-sm text-white">{fmtCurrency(simValue)}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtCurrency(pnl)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}

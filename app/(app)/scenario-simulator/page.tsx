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
  if (!portfolio) return <div className="t-3 p-8">Loading...</div>;

  const stats = calcPortfolioStats(portfolio.assets);
  const scenarios = generateScenarios(portfolio.assets);
  const icons = { bull: TrendingUp, sideways: Minus, bear: TrendingDown };

  const simulatedValue = stats.totalValue * (1 + priceChange / 100);
  const simulatedPnL = simulatedValue - stats.totalInvested;
  const simulatedPnLPct = stats.totalInvested > 0 ? (simulatedPnL / stats.totalInvested) * 100 : 0;

  return (
    <>
      <Header title="Scenario Simulator" subtitle="Model market conditions and portfolio outcomes" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold t-1 mb-4">What-If Price Simulator</h2>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs t-3">Portfolio-wide price change</span>
              <span className={`text-sm font-bold ${priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange}%
              </span>
            </div>
            <input type="range" min="-80" max="200" step="5" value={priceChange}
              onChange={(e) => setPriceChange(Number(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${priceChange < 0 ? '#ef4444' : '#22c55e'} ${Math.abs(priceChange) / (priceChange < 0 ? 0.8 : 2) * 100}%, var(--border-strong) ${Math.abs(priceChange) / (priceChange < 0 ? 0.8 : 2) * 100}%)`, touchAction: 'none' }} />
            <div className="flex justify-between text-[10px] t-3 mt-1">
              <span>-80%</span><span>0%</span><span>+200%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="glass-dark rounded-xl p-3">
              <div className="text-[10px] t-3 mb-1">Simulated Value</div>
              <div className="text-base font-bold t-1">{fmtCurrency(simulatedValue)}</div>
              <div className="text-[10px] t-3">vs. {fmtCurrency(stats.totalValue)} now</div>
            </div>
            <div className="glass-dark rounded-xl p-3">
              <div className="text-[10px] t-3 mb-1">Simulated P/L</div>
              <div className={`text-base font-bold ${simulatedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtCurrency(simulatedPnL)}
              </div>
              <div className={`text-[10px] ${simulatedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtPercent(simulatedPnLPct)}
              </div>
            </div>
          </div>
          <button onClick={() => setPriceChange(0)} className="mt-3 text-xs t-3 hover:text-orange-500 transition-colors">
            Reset to current
          </button>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold t-1 mb-4">Scenario Outlook</h2>
          <div className="space-y-3">
            {scenarios.map((s) => {
              const Icon = icons[s.scenario];
              const simValue = stats.totalValue * (1 + (s.returnRangeLow + s.returnRangeHigh) / 2 / 100);
              const returnStr = `${s.returnRangeLow >= 0 ? '+' : ''}${s.returnRangeLow}% to +${s.returnRangeHigh}%`;
              const timeStr = `${s.recoveryTimeLow}${s.recoveryTimeHigh ? `–${s.recoveryTimeHigh}` : '+'} months`;
              return (
                <div key={s.scenario} className="flex items-center gap-3 p-3 glass-dark rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    s.scenario === 'bull' ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : s.scenario === 'sideways' ? 'bg-yellow-500/10 border border-yellow-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    <Icon size={14} className={s.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold t-1">{s.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${s.badgeColor}`}>{s.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[10px] t-3">Est. {fmtCurrency(simValue)} · {timeStr}</span>
                      <span className={`text-xs font-bold flex-shrink-0 ${s.color}`}>{returnStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-sm font-semibold t-1 mb-4">Per-Asset Simulation ({priceChange >= 0 ? '+' : ''}{priceChange}% change)</h2>

        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          {portfolio.assets.map((asset) => {
            const simPrice = asset.currentPrice * (1 + priceChange / 100);
            const curValue = asset.currentPrice * asset.amount;
            const simValue = simPrice * asset.amount;
            const pnl = simValue - asset.entryPrice * asset.amount;
            const up = simPrice >= asset.currentPrice;
            return (
              <div key={asset.id} className="glass-dark rounded-xl p-3">
                {/* Row 1: symbol + P/L */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: asset.color + '33', border: `1px solid ${asset.color}55`, color: asset.color }}>
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <span className="text-sm font-semibold t-1">{asset.symbol}</span>
                  </div>
                  <span className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {pnl >= 0 ? '+' : ''}{fmtCurrency(pnl)}
                  </span>
                </div>
                {/* Row 2: prices */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="t-3">Price: <span className="t-2 font-medium">{fmtCurrency(asset.currentPrice)}</span> → <span className={`font-semibold ${up ? 'text-emerald-500' : 'text-red-500'}`}>{fmtCurrency(simPrice)}</span></span>
                </div>
                {/* Row 3: values */}
                <div className="flex items-center justify-between text-[11px] mt-0.5">
                  <span className="t-3">Value: <span className="t-2 font-medium">{fmtCurrency(curValue)}</span> → <span className="t-1 font-semibold">{fmtCurrency(simValue)}</span></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Asset', 'Current Price', 'Simulated Price', 'Current Value', 'Simulated Value', 'P/L'].map((h) => (
                  <th key={h} className="text-left text-[11px] t-3 font-medium px-4 py-2">{h}</th>
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
                  <tr key={asset.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 text-sm font-semibold t-1">{asset.symbol}</td>
                    <td className="px-4 py-3 text-sm t-2">{fmtCurrency(asset.currentPrice)}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${simPrice >= asset.currentPrice ? 'text-emerald-500' : 'text-red-500'}`}>{fmtCurrency(simPrice)}</td>
                    <td className="px-4 py-3 text-sm t-2">{fmtCurrency(curValue)}</td>
                    <td className="px-4 py-3 text-sm t-1 font-medium">{fmtCurrency(simValue)}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtCurrency(pnl)}</td>
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

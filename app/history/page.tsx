'use client';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { loadPortfolio } from '@/lib/storage';
import { calcPortfolioStats, fmtCurrency, fmtPercent } from '@/lib/calculations';
import { Portfolio } from '@/lib/types';

export default function HistoryPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);
  if (!portfolio) return <div className="text-zinc-500 p-8">Loading...</div>;

  const stats = calcPortfolioStats(portfolio.assets);

  // Simulated history snapshots based on current data
  const snapshots = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = (6 - i);
    const change = (Math.random() - 0.5) * 0.04;
    const value = stats.totalValue * (1 + change * (daysAgo + 1) * 0.2);
    const pnl = value - stats.totalInvested;
    const pnlPct = (pnl / stats.totalInvested) * 100;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value, pnl, pnlPct };
  });

  return (
    <>
      <Header title="History" subtitle="Portfolio value history and performance tracking" lastUpdated={portfolio.lastUpdated} />

      <GlassCard className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">7-Day Portfolio Snapshot</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                {['Date', 'Portfolio Value', 'Unrealized P/L', 'P/L %', 'Status'].map((h) => (
                  <th key={h} className="text-left text-[11px] text-zinc-500 font-medium px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap, i) => (
                <tr key={i} className="table-row-hover border-b border-zinc-800/30">
                  <td className="px-4 py-3 text-sm text-zinc-300">{snap.date}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{fmtCurrency(snap.value)}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${snap.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtCurrency(snap.pnl)}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${snap.pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPercent(snap.pnlPct)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${snap.pnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {snap.pnl >= 0 ? 'Gain' : 'Loss'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-zinc-600 mt-3 text-center">
          Note: Historical snapshots are illustrative. Connect a data feed for real tracking.
        </p>
      </GlassCard>
    </>
  );
}

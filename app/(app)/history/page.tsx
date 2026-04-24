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
  if (!portfolio) return <div className="t-3 p-8">Loading...</div>;

  const stats = calcPortfolioStats(portfolio.assets);

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
          <Clock size={14} className="t-2" />
          <h2 className="text-sm font-semibold t-1">7-Day Portfolio Snapshot</h2>
        </div>

        {/* Mobile rows */}
        <div className="md:hidden divide-y" style={{ borderTop: '1px solid var(--border)' }}>
          {snapshots.map((snap, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              {/* Date */}
              <div className="w-12 flex-shrink-0 text-center">
                <div className="text-[11px] font-semibold t-2">{snap.date.split(' ')[0]}</div>
                <div className="text-sm font-bold t-1">{snap.date.split(' ')[1]}</div>
              </div>
              {/* Values */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold t-1">{fmtCurrency(snap.value)}</div>
                <div className={`text-[11px] font-medium ${snap.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {snap.pnl >= 0 ? '+' : ''}{fmtCurrency(snap.pnl)}
                </div>
              </div>
              {/* P/L % + badge */}
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-bold ${snap.pnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtPercent(snap.pnlPct)}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${snap.pnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                  {snap.pnl >= 0 ? 'Gain' : 'Loss'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Portfolio Value', 'Unrealized P/L', 'P/L %', 'Status'].map((h) => (
                  <th key={h} className="text-left text-[11px] t-3 font-medium px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap, i) => (
                <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 text-sm t-2">{snap.date}</td>
                  <td className="px-4 py-3 text-sm font-semibold t-1">{fmtCurrency(snap.value)}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${snap.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtCurrency(snap.pnl)}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${snap.pnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtPercent(snap.pnlPct)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${snap.pnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      {snap.pnl >= 0 ? 'Gain' : 'Loss'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] t-3 mt-3 text-center">
          Note: Historical snapshots are illustrative. Connect a data feed for real tracking.
        </p>
      </GlassCard>
    </>
  );
}

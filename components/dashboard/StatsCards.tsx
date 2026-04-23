'use client';
import { DollarSign, Activity, CreditCard, Target, Shield } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { PortfolioStats, RiskScore } from '@/lib/types';
import { fmtCurrency, fmtPercent } from '@/lib/calculations';

interface StatsCardsProps {
  stats: PortfolioStats;
  risk: RiskScore;
}

export default function StatsCards({ stats, risk }: StatsCardsProps) {
  const pnlPositive = stats.totalUnrealizedPnL >= 0;
  const breakevenMove = stats.totalValue > 0
    ? ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100
    : 0;

  const riskColor = risk.score < 30 ? '#22c55e' : risk.score < 55 ? '#eab308' : risk.score < 75 ? '#f97316' : '#ef4444';
  const riskAngle = (risk.score / 100) * 180;

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      <GlassCard className="p-4" hover>
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit mb-3">
          <DollarSign size={16} className="text-blue-500" />
        </div>
        <div className="text-[11px] t-3 mb-1">Total Portfolio Value</div>
        <div className="text-xl font-bold t-1">{fmtCurrency(stats.totalValue)}</div>
        <div className="text-xs text-emerald-500 mt-1">
          24h Change <span className="font-medium">{fmtPercent(stats.change24h)}</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4" hover glow={pnlPositive ? 'green' : 'red'}>
        <div className={`p-2 rounded-lg w-fit mb-3 ${pnlPositive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <Activity size={16} className={pnlPositive ? 'text-emerald-500' : 'text-red-500'} />
        </div>
        <div className="text-[11px] t-3 mb-1">Total Unrealized P/L</div>
        <div className={`text-xl font-bold ${pnlPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {fmtCurrency(stats.totalUnrealizedPnL)}
        </div>
        <div className={`text-xs mt-1 font-medium ${pnlPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {fmtPercent(stats.totalUnrealizedPnLPercent)}
        </div>
      </GlassCard>

      <GlassCard className="p-4" hover>
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 w-fit mb-3">
          <CreditCard size={16} className="text-purple-500" />
        </div>
        <div className="text-[11px] t-3 mb-1">Total Invested</div>
        <div className="text-xl font-bold t-1">{fmtCurrency(stats.totalInvested)}</div>
        <div className="text-xs t-3 mt-1">
          Avg. Entry Price <span className="t-2 font-medium">{fmtCurrency(stats.avgEntryPrice)}</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4" hover>
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 w-fit mb-3">
          <Target size={16} className="text-orange-500" />
        </div>
        <div className="text-[11px] t-3 mb-1">Breakeven (Portfolio)</div>
        <div className="text-xl font-bold t-1">{fmtCurrency(stats.breakevenValue)}</div>
        <div className="text-xs text-orange-500 mt-1">
          Need <span className="font-medium">+{Math.abs(breakevenMove).toFixed(2)}%</span> to Breakeven
        </div>
      </GlassCard>

      <GlassCard className="p-4 flex flex-col items-center justify-center" hover>
        <div className="flex items-start w-full justify-between mb-2">
          <div className="p-2 rounded-lg glass-dark w-fit">
            <Shield size={16} className="t-2" />
          </div>
          <span className="text-[10px] t-3">Risk Score</span>
        </div>
        <div className="relative w-28 h-16 mt-1">
          <svg viewBox="0 0 120 60" className="w-full h-full">
            <path d="M10 55 A 50 50 0 0 1 110 55" fill="none" stroke="var(--border-strong)" strokeWidth="10" strokeLinecap="round" />
            <path d="M10 55 A 50 50 0 0 1 110 55" fill="none" stroke={riskColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(riskAngle / 180) * 157} 157`} style={{ transition: 'stroke-dasharray 0.5s ease' }} />
            <g transform={`rotate(${riskAngle - 90}, 60, 55)`}>
              <line x1="60" y1="55" x2="60" y2="20" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="60" cy="55" r="3" fill="var(--text-1)" />
            </g>
            <text x="60" y="46" textAnchor="middle" fill="var(--text-1)" fontSize="16" fontWeight="bold">{risk.score}</text>
            <text x="60" y="54" textAnchor="middle" fill="var(--text-3)" fontSize="6">/100</text>
          </svg>
        </div>
        <div className="text-xs mt-1 font-medium" style={{ color: riskColor }}>{risk.level}</div>
      </GlassCard>
    </div>
  );
}

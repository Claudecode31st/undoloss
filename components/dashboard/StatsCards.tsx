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
      {/* Total Portfolio Value */}
      <GlassCard className="p-4 col-span-1" hover>
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <DollarSign size={16} className="text-blue-400" />
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 mb-1">Total Portfolio Value</div>
        <div className="text-xl font-bold text-white">{fmtCurrency(stats.totalValue)}</div>
        <div className="text-xs text-emerald-400 mt-1">
          24h Change <span className="font-medium">{fmtPercent(stats.change24h)}</span>
        </div>
      </GlassCard>

      {/* Total Unrealized P/L */}
      <GlassCard className="p-4 col-span-1" hover glow={pnlPositive ? 'green' : 'red'}>
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${pnlPositive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <Activity size={16} className={pnlPositive ? 'text-emerald-400' : 'text-red-400'} />
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 mb-1">Total Unrealized P/L</div>
        <div className={`text-xl font-bold ${pnlPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {fmtCurrency(stats.totalUnrealizedPnL)}
        </div>
        <div className={`text-xs mt-1 font-medium ${pnlPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {fmtPercent(stats.totalUnrealizedPnLPercent)}
        </div>
      </GlassCard>

      {/* Total Invested */}
      <GlassCard className="p-4 col-span-1" hover>
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <CreditCard size={16} className="text-purple-400" />
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 mb-1">Total Invested</div>
        <div className="text-xl font-bold text-white">{fmtCurrency(stats.totalInvested)}</div>
        <div className="text-xs text-zinc-500 mt-1">
          Avg. Entry Price <span className="text-zinc-300">{fmtCurrency(stats.avgEntryPrice)}</span>
        </div>
      </GlassCard>

      {/* Breakeven */}
      <GlassCard className="p-4 col-span-1" hover>
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Target size={16} className="text-orange-400" />
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 mb-1">Breakeven (Portfolio)</div>
        <div className="text-xl font-bold text-white">{fmtCurrency(stats.breakevenValue)}</div>
        <div className="text-xs text-orange-400 mt-1">
          Need <span className="font-medium">+{Math.abs(breakevenMove).toFixed(2)}%</span> to Breakeven
        </div>
      </GlassCard>

      {/* Risk Score Gauge */}
      <GlassCard className="p-4 col-span-1 flex flex-col items-center justify-center" hover>
        <div className="flex items-start w-full justify-between mb-2">
          <div className="p-2 rounded-lg bg-zinc-700/30 border border-zinc-700/50">
            <Shield size={16} className="text-zinc-300" />
          </div>
          <span className="text-[10px] text-zinc-500">Risk Score</span>
        </div>
        {/* Gauge SVG */}
        <div className="relative w-28 h-16 mt-1">
          <svg viewBox="0 0 120 60" className="w-full h-full">
            {/* Background arc */}
            <path d="M10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round" />
            {/* Score arc */}
            <path
              d="M10 55 A 50 50 0 0 1 110 55"
              fill="none"
              stroke={riskColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(riskAngle / 180) * 157} 157`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            {/* Needle */}
            <g transform={`rotate(${riskAngle - 90}, 60, 55)`}>
              <line x1="60" y1="55" x2="60" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="60" cy="55" r="3" fill="white" />
            </g>
            {/* Score text */}
            <text x="60" y="46" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{risk.score}</text>
            <text x="60" y="54" textAnchor="middle" fill="#71717a" fontSize="6">/100</text>
          </svg>
        </div>
        <div className="text-xs mt-1 font-medium" style={{ color: riskColor }}>
          {risk.level}
        </div>
      </GlassCard>
    </div>
  );
}

'use client';
import { DollarSign, Activity, CreditCard, Target, Shield, Wallet } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset, PortfolioStats, RiskScore } from '@/lib/types';
import { fmtCurrency, fmtPercent } from '@/lib/calculations';

interface StatsCardsProps {
  stats: PortfolioStats;
  risk: RiskScore;
  assets: CryptoAsset[];
  assetCount: number;
  show24hChange?: boolean;
}

export default function StatsCards({ stats, risk, assets, assetCount, show24hChange = true }: StatsCardsProps) {
  const pnlPositive = stats.totalUnrealizedPnL >= 0;
  const breakevenMove = stats.totalValue > 0
    ? ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100
    : 0;

  const riskColor = risk.score < 30 ? '#22c55e' : risk.score < 55 ? '#eab308' : risk.score < 75 ? '#f97316' : '#ef4444';

  // Capital available = sum of capitalLeft across all assets
  const capitalAvailable = assets.reduce((sum, a) => sum + (a.capitalLeft ?? 0), 0);

  // Risk breakdown bar width helpers
  const ddPct = risk.drawdownScore / 40 * 100;
  const concPct = risk.concentrationScore / 35 * 100;
  const divPct = risk.exposureScore / 25 * 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
      {/* 1. Portfolio Value */}
      <GlassCard className="p-4" hover>
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit mb-3">
          <DollarSign size={16} className="text-blue-500" />
        </div>
        <div className="text-[11px] t-3 mb-1">Portfolio Value</div>
        <div className="text-xl font-bold t-1">{fmtCurrency(stats.totalValue)}</div>
        {show24hChange && (
          <div className={`text-xs mt-1 ${stats.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            24h <span className="font-medium">{stats.change24h >= 0 ? '+' : ''}{fmtPercent(stats.change24h, false)}</span>
          </div>
        )}
      </GlassCard>

      {/* 2. Unrealized P/L */}
      <GlassCard className="p-4" hover glow={pnlPositive ? 'green' : 'red'}>
        <div className={`p-2 rounded-lg w-fit mb-3 ${pnlPositive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <Activity size={16} className={pnlPositive ? 'text-emerald-500' : 'text-red-500'} />
        </div>
        <div className="text-[11px] t-3 mb-1">Unrealized P/L (ROI)</div>
        <div className={`text-xl font-bold ${pnlPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {fmtCurrency(stats.totalUnrealizedPnL)}
        </div>
        <div className={`text-xs mt-1 font-medium ${pnlPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {fmtPercent(stats.totalUnrealizedPnLPercent)}
        </div>
      </GlassCard>

      {/* 3. Capital Deployed */}
      <GlassCard className="p-4" hover>
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 w-fit mb-3">
          <CreditCard size={16} className="text-purple-500" />
        </div>
        <div className="text-[11px] t-3 mb-1">Capital Deployed</div>
        <div className="text-xl font-bold t-1">{fmtCurrency(stats.totalInvested)}</div>
        <div className="text-xs t-3 mt-1">
          <span className="t-2 font-medium">{assetCount} position{assetCount !== 1 ? 's' : ''}</span>
        </div>
      </GlassCard>

      {/* 4. Capital Available */}
      <GlassCard className="p-4" hover>
        <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 w-fit mb-3">
          <Wallet size={16} className="text-teal-500" />
        </div>
        <div className="text-[11px] t-3 mb-1">Capital Available</div>
        <div className={`text-xl font-bold ${capitalAvailable > 0 ? 'text-teal-500' : 't-1'}`}>
          {capitalAvailable > 0 ? fmtCurrency(capitalAvailable) : '—'}
        </div>
        <div className="text-xs t-3 mt-1">
          {capitalAvailable > 0 ? 'left to deploy' : 'set in positions'}
        </div>
      </GlassCard>

      {/* 5. Breakeven */}
      <GlassCard className="p-4" hover glow={breakevenMove <= 0 ? 'green' : undefined}>
        <div className={`p-2 rounded-lg w-fit mb-3 ${breakevenMove <= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
          <Target size={16} className={breakevenMove <= 0 ? 'text-emerald-500' : 'text-orange-500'} />
        </div>
        <div className="text-[11px] t-3 mb-1">Breakeven Target</div>
        <div className="text-xl font-bold t-1">{fmtCurrency(stats.breakevenValue)}</div>
        {breakevenMove <= 0 ? (
          <div className="text-xs text-emerald-500 mt-1 font-medium">
            ✓ +{Math.abs(breakevenMove).toFixed(1)}% above cost
          </div>
        ) : (
          <div className="text-xs text-orange-500 mt-1">
            Need <span className="font-medium">+{breakevenMove.toFixed(1)}%</span> to recover
          </div>
        )}
      </GlassCard>

      {/* 6. Risk Score — detailed breakdown */}
      <GlassCard className="p-4" hover>
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-lg glass-dark w-fit">
            <Shield size={16} className="t-2" />
          </div>
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: riskColor }}>{risk.score}</div>
            <div className="text-[10px] font-semibold" style={{ color: riskColor }}>{risk.level}</div>
          </div>
        </div>
        {/* Three mini bars */}
        <div className="space-y-1.5 mt-1">
          <div>
            <div className="flex justify-between text-[9px] t-3 mb-0.5">
              <span>Drawdown</span>
              <span>{Math.round(risk.drawdownScore)}/40</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${ddPct}%`, background: '#ef4444' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[9px] t-3 mb-0.5">
              <span>Concentration</span>
              <span>{Math.round(risk.concentrationScore)}/35</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${concPct}%`, background: '#f97316' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[9px] t-3 mb-0.5">
              <span>Diversification</span>
              <span>{Math.round(risk.exposureScore)}/25</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${divPct}%`, background: '#eab308' }} />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

'use client';
import { useState, useRef, useEffect } from 'react';
import { DollarSign, Activity, CreditCard, Shield, Wallet, Pencil, Check, X } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset, PortfolioStats, RiskScore } from '@/lib/types';
import { fmtCurrency, fmtPercent, calcInitialMargin } from '@/lib/calculations';

interface StatsCardsProps {
  stats: PortfolioStats;
  risk: RiskScore;
  assets: CryptoAsset[];
  assetCount: number;
  show24hChange?: boolean;
  crossMarginBalance?: number;
  onCrossMarginChange?: (v: number) => void;
}

export default function StatsCards({ stats, risk, assets, assetCount, show24hChange = true, crossMarginBalance = 0, onCrossMarginChange }: StatsCardsProps) {
  const [editingMargin, setEditingMargin] = useState(false);
  const [marginInput, setMarginInput] = useState('');
  const marginRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMargin && marginRef.current) marginRef.current.focus();
  }, [editingMargin]);

  function commitMargin() {
    const val = parseFloat(marginInput.replace(/[^0-9.]/g, ''));
    if (val > 0) onCrossMarginChange?.(val);
    setEditingMargin(false);
  }

  const pnlPositive = stats.totalUnrealizedPnL >= 0;
  // How much % gain needed on current value to reach breakeven (correct for recovery math)
  const breakevenMove = stats.totalValue > 0
    ? ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100
    : 0;
  // ROI % using cost as denominator — matches the P/L card and table values
  const roiPct = stats.totalInvested > 0
    ? ((stats.totalValue - stats.totalInvested) / stats.totalInvested) * 100
    : 0;

  const riskColor = risk.score < 30 ? '#22c55e' : risk.score < 55 ? '#eab308' : risk.score < 75 ? '#f97316' : '#ef4444';

  // Actual capital committed per position = notional / leverage (margin)
  // For unlevered positions it equals the full notional
  const actualCapitalDeployed = assets.reduce((sum, a) => {
    const lev = a.leverage ?? 1;
    return sum + (a.entryPrice * a.amount) / lev;
  }, 0);
  const totalNotional = stats.totalInvested; // raw notional (entryPrice × amount, no lev adjustment)
  const hasLeverage = assets.some(a => (a.leverage ?? 1) > 1);
  const avgLeverage = hasLeverage && actualCapitalDeployed > 0
    ? Math.round(totalNotional / actualCapitalDeployed)
    : 1;

  // Cross-margin margin utilisation
  const totalMarginUsed = assets.reduce((sum, a) => sum + ((a.leverage ?? 1) > 1 ? calcInitialMargin(a) : 0), 0);
  const marginAvailable = crossMarginBalance > 0 ? Math.max(0, crossMarginBalance - totalMarginUsed) : 0;
  const marginUsedPct   = crossMarginBalance > 0 ? Math.min(100, (totalMarginUsed / crossMarginBalance) * 100) : 0;
  const marginBarColor  = marginUsedPct > 85 ? '#ef4444' : marginUsedPct > 60 ? '#f97316' : marginUsedPct > 35 ? '#eab308' : '#22c55e';

  // Risk bar widths
  const ddPct   = risk.drawdownScore   / 40 * 100;
  const levPct  = risk.leverageScore   / 35 * 100;
  const liqPct  = risk.liquidationScore / 25 * 100;

  // Leverage label + progressive colour
  // Risk rises with both how high the leverage is AND how much of the portfolio is in it
  const levLabel = risk.maxLeverage <= 1
    ? 'No leverage'
    : `${risk.leveragedPortfolioPct.toFixed(0)}% of portfolio at ${risk.maxLeverage}×`;
  const levColor =
    risk.maxLeverage <= 1                                              ? '#22c55e' // green  — no leverage
    : risk.maxLeverage <= 3 && risk.leveragedPortfolioPct <= 25       ? '#22c55e' // green  — low lev, small slice
    : risk.maxLeverage <= 3 && risk.leveragedPortfolioPct <= 60       ? '#eab308' // yellow — low lev, bigger slice
    : risk.maxLeverage <= 5 && risk.leveragedPortfolioPct <= 40       ? '#eab308' // yellow — mid lev, moderate slice
    : risk.maxLeverage <= 5                                           ? '#f97316' // orange — mid lev, large slice
    : risk.leveragedPortfolioPct <= 25                                ? '#f97316' // orange — high lev, small slice
    :                                                                   '#ef4444'; // red    — high lev, large slice

  // Liquidation distance label + progressive colour
  const liqLabel = risk.closestLiqDistPct === null
    ? 'No leveraged positions'
    : risk.closestLiqDistPct <= 0
    ? 'Already liquidated!'
    : `Nearest liq −${risk.closestLiqDistPct.toFixed(0)}% away`;
  const liqColor =
    risk.closestLiqDistPct === null  ? '#22c55e'
    : risk.closestLiqDistPct <= 0   ? '#ef4444'
    : risk.closestLiqDistPct < 10   ? '#ef4444'
    : risk.closestLiqDistPct < 20   ? '#f97316'
    : risk.closestLiqDistPct < 35   ? '#eab308'
    :                                  '#22c55e';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
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
        <div className="text-[11px] t-3 mb-1">Unrealized P/L</div>
        <div className={`text-xl font-bold ${pnlPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {fmtCurrency(stats.totalUnrealizedPnL)}
        </div>
        <div className={`text-xs mt-1 font-medium ${pnlPositive ? 'text-emerald-500' : 'text-orange-500'}`}>
          {pnlPositive
            ? `✓ +${roiPct.toFixed(1)}% ROI · in profit`
            : `Need +${breakevenMove.toFixed(1)}% to recover`
          }
        </div>
      </GlassCard>

      {/* 3. Capital Deployed (margin-adjusted) */}
      <GlassCard className="p-4" hover>
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 w-fit mb-3">
          <CreditCard size={16} className="text-purple-500" />
        </div>
        <div className="text-[11px] t-3 mb-1">{hasLeverage ? 'Margin Committed' : 'Capital Deployed'}</div>
        <div className="text-xl font-bold t-1">{fmtCurrency(actualCapitalDeployed)}</div>
        <div className="text-xs t-3 mt-1">
          {hasLeverage
            ? <><span className="t-2 font-medium">~{fmtCurrency(totalNotional, 0)}</span> notional · {avgLeverage}× avg</>
            : <span className="t-2 font-medium">{assetCount} position{assetCount !== 1 ? 's' : ''}</span>
          }
        </div>
      </GlassCard>

      {/* 4. Cross-Margin Account */}
      <GlassCard className="p-4" hover>
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 w-fit">
            <Wallet size={16} className="text-teal-500" />
          </div>
          {!editingMargin && (
            <button
              onClick={() => { setMarginInput(crossMarginBalance > 0 ? String(Math.round(crossMarginBalance)) : ''); setEditingMargin(true); }}
              className="p-1 rounded-lg t-3 hover:text-teal-400 transition-colors"
              title="Edit cross-margin balance"
            >
              <Pencil size={11} />
            </button>
          )}
        </div>
        <div className="text-[11px] t-3 mb-1">Margin Account</div>
        {editingMargin ? (
          <div className="flex items-center gap-1 mb-1">
            <input
              ref={marginRef}
              type="number"
              value={marginInput}
              onChange={e => setMarginInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitMargin(); if (e.key === 'Escape') setEditingMargin(false); }}
              className="glass-input w-full rounded-lg px-2 py-1 text-sm font-bold t-1"
              placeholder="Account balance"
            />
            <button onClick={commitMargin} className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 flex-shrink-0"><Check size={12} /></button>
            <button onClick={() => setEditingMargin(false)} className="p-1 rounded t-3 hover:t-1 flex-shrink-0"><X size={12} /></button>
          </div>
        ) : (
          <div className={`text-xl font-bold ${crossMarginBalance > 0 ? 'text-teal-500' : 't-3'}`}>
            {crossMarginBalance > 0 ? fmtCurrency(crossMarginBalance) : '— tap ✎'}
          </div>
        )}
        {crossMarginBalance > 0 && !editingMargin && (
          <div className="mt-1.5 space-y-1">
            {/* Margin utilisation bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${marginUsedPct}%`, background: marginBarColor }} />
            </div>
            <div className="flex justify-between text-[9px] tabular-nums">
              <span className="t-3">Used <span className="font-semibold" style={{ color: marginBarColor }}>{fmtCurrency(totalMarginUsed, 0)}</span></span>
              <span style={{ color: '#2dd4bf' }} className="font-semibold">{fmtCurrency(marginAvailable, 0)} free</span>
            </div>
          </div>
        )}
        {crossMarginBalance <= 0 && !editingMargin && (
          <div className="text-[10px] t-3 mt-1">cross-margin balance</div>
        )}
      </GlassCard>

      {/* 5. Risk Score */}
      <GlassCard className="p-4" hover>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg glass-dark w-fit">
            <Shield size={16} className="t-2" />
          </div>
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: riskColor }}>{risk.score}</div>
            <div className="text-[10px] font-semibold" style={{ color: riskColor }}>{risk.level}</div>
          </div>
        </div>
        <div className="space-y-2">
          {/* Drawdown */}
          <div>
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-[9px] t-3">Drawdown</span>
              <span className={`text-[9px] font-semibold ${risk.drawdownScore === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {risk.drawdownScore === 0
                  ? 'In profit'
                  : `−${Math.abs(stats.totalUnrealizedPnLPercent).toFixed(1)}% from cost`}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${ddPct}%`, background: '#ef4444' }} />
            </div>
          </div>
          {/* Leverage exposure */}
          <div>
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-[9px] t-3">Leverage</span>
              <span className="text-[9px] font-semibold" style={{ color: levColor }}>
                {levLabel}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${levPct}%`, background: levColor }} />
            </div>
          </div>
          {/* Liquidation proximity */}
          <div>
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-[9px] t-3">Liquidation</span>
              <span className="text-[9px] font-semibold" style={{ color: liqColor }}>
                {liqLabel}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${liqPct}%`, background: liqColor }} />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

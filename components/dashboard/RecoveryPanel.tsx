'use client';
import { useState } from 'react';
import { Scissors, Anchor, TrendingDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcPortfolioStats, fmtCurrency, fmtPercent } from '@/lib/calculations';

interface RecoveryPanelProps {
  assets: CryptoAsset[];
}

function pctGainNeeded(target: number, base: number) {
  if (base <= 0) return 0;
  return ((target / base) - 1) * 100;
}

export default function RecoveryPanel({ assets }: RecoveryPanelProps) {
  const [freshCapital, setFreshCapital] = useState(1000);

  if (assets.length === 0) return null;

  const stats = calcPortfolioStats(assets);
  const { totalValue: cur, totalInvested: inv } = stats;
  const pnlAmt = cur - inv;
  const pnlPct = inv > 0 ? ((cur - inv) / inv) * 100 : 0;
  const isProfit = pnlAmt >= 0;
  const drawdown = isProfit ? 0 : Math.abs(pnlPct);

  // ── Path math ──────────────────────────────────────────
  // Hold: keep everything, no new money
  const holdTarget = inv;
  const holdNeed = pctGainNeeded(holdTarget, cur);

  // Cut & Restart: sell now → proceeds + fresh → redeploy
  const cutProceeds = cur;
  const cutPool = cutProceeds + freshCapital;
  const cutTarget = inv; // need to get back to what you originally put in
  const cutNeed = pctGainNeeded(cutTarget, cutPool);
  const cutCovered = cutPool >= cutTarget;

  // Average Down: add fresh capital to existing positions
  const dcaPool = cur + freshCapital;
  const dcaTarget = inv + freshCapital; // new higher bar since you're adding money
  const dcaNeed = pctGainNeeded(dcaTarget, dcaPool);
  const dcaCovered = dcaPool >= dcaTarget;

  return (
    <GlassCard className="p-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Recovery Paths
          </h2>
          <div className="text-[10px] t-3 mt-0.5 flex items-center gap-1.5 flex-wrap">
            {isProfit ? (
              <>
                <span className="text-emerald-500 font-semibold">+{pnlPct.toFixed(1)}% ROI</span>
                <span>·</span>
                <span className="text-emerald-500 font-semibold">{fmtCurrency(pnlAmt)} above cost</span>
                <span>·</span>
                <span className="t-3">All paths covered</span>
              </>
            ) : (
              <>
                <span>Drawdown</span>
                <span className="text-red-500 font-semibold">−{drawdown.toFixed(1)}%</span>
                <span>·</span>
                <span>Down</span>
                <span className="text-red-500 font-semibold">{fmtCurrency(Math.abs(pnlAmt))}</span>
                <span>·</span>
                <span>Hold needs</span>
                <span className="text-orange-500 font-semibold">+{holdNeed.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>
        {/* Fresh capital slider */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1 max-w-xs">
          <span className="text-[10px] t-3 whitespace-nowrap">Fresh capital</span>
          <input
            type="range" min={0} max={20000} step={100}
            value={freshCapital}
            onChange={(e) => setFreshCapital(Number(e.target.value))}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f97316 ${(freshCapital / 20000) * 100}%, var(--border-strong) ${(freshCapital / 20000) * 100}%)`,
              touchAction: 'none',
            }}
          />
          <span className="text-xs font-bold text-orange-500 whitespace-nowrap w-14 text-right">
            {fmtCurrency(freshCapital, 0)}
          </span>
        </div>
      </div>

      {/* ── Three strategy cards ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">

        {/* 1. Hold */}
        <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--surface-deep)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Anchor size={13} className="text-orange-500" />
            </div>
            <div>
              <div className="text-xs font-bold t-1 leading-tight">Hold</div>
              <div className="text-[9px] t-3 leading-tight">Do nothing, wait</div>
            </div>
          </div>
          {/* Steps */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">Keep positions</span>
              <span className="font-semibold t-2">{fmtCurrency(cur)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">New capital</span>
              <span className="font-semibold t-3">$0</span>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">Recover target</span>
              <span className="font-semibold t-2">{fmtCurrency(holdTarget)}</span>
            </div>
          </div>
          {/* Result */}
          <div className={`rounded-lg px-2.5 py-1.5 text-center ${holdNeed <= 0 ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}>
            {holdNeed <= 0
              ? <span className="text-xs font-bold text-emerald-500">✓ Already covered</span>
              : <span className="text-xs font-bold text-orange-500">Need +{holdNeed.toFixed(1)}% gain</span>
            }
          </div>
        </div>

        {/* 2. Cut & Restart */}
        <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--surface-deep)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Scissors size={13} className="text-red-500" />
            </div>
            <div>
              <div className="text-xs font-bold t-1 leading-tight">Cut & Restart</div>
              <div className="text-[9px] t-3 leading-tight">Sell all, redeploy</div>
            </div>
          </div>
          {/* Steps */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">Sell proceeds</span>
              <span className="font-semibold t-2">{fmtCurrency(cutProceeds)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">+ Fresh capital</span>
              <span className="font-semibold text-orange-500">+{fmtCurrency(freshCapital, 0)}</span>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">Redeploy total</span>
              <span className="font-semibold t-2">{fmtCurrency(cutPool)}</span>
            </div>
          </div>
          {/* Result */}
          <div className={`rounded-lg px-2.5 py-1.5 text-center ${cutCovered ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            {cutCovered
              ? <span className="text-xs font-bold text-emerald-500">✓ Already covered</span>
              : <span className="text-xs font-bold text-red-500">Need +{cutNeed.toFixed(1)}% gain</span>
            }
          </div>
        </div>

        {/* 3. Average Down */}
        <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--surface-deep)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={13} className="text-emerald-500" />
            </div>
            <div>
              <div className="text-xs font-bold t-1 leading-tight">Average Down</div>
              <div className="text-[9px] t-3 leading-tight">Buy more, lower avg</div>
            </div>
          </div>
          {/* Steps */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">Current value</span>
              <span className="font-semibold t-2">{fmtCurrency(cur)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">+ Buy more</span>
              <span className="font-semibold text-orange-500">+{fmtCurrency(freshCapital, 0)}</span>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="flex items-center justify-between text-[10px]">
              <span className="t-3">New target</span>
              <span className="font-semibold t-2">{fmtCurrency(dcaTarget)}</span>
            </div>
          </div>
          {/* Result */}
          <div className={`rounded-lg px-2.5 py-1.5 text-center ${dcaCovered ? 'bg-emerald-500/10' : 'bg-emerald-500/8'}`}>
            {dcaCovered
              ? <span className="text-xs font-bold text-emerald-500">✓ Already covered</span>
              : (
                <div>
                  <span className="text-xs font-bold text-emerald-600">Need +{dcaNeed.toFixed(1)}%</span>
                  {holdNeed > 0 && (
                    <span className="text-[9px] text-emerald-500 ml-1">
                      ({(holdNeed - dcaNeed).toFixed(1)}pp saved)
                    </span>
                  )}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* Hint to use DCA Planner for execution */}
      {!isProfit && freshCapital > 0 && (
        <div className="border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] t-3 text-center">
            Ready to average down? Head to <span className="text-orange-500 font-medium">DCA Planner</span> to build your month-by-month buy schedule.
          </p>
        </div>
      )}
    </GlassCard>
  );
}

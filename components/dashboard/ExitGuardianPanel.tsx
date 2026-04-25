'use client';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcPortfolioStats, fmtCurrency } from '@/lib/calculations';

type StopLevel = 'conservative' | 'balanced' | 'lastresort';

const STOPS: Record<StopLevel, { label: string; short: string; drop: number; color: string; bg: string; border: string }> = {
  conservative: { label: 'Conservative', short: '−10%', drop: -10, color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'rgba(59,130,246,0.25)' },
  balanced:     { label: 'Balanced',     short: '−20%', drop: -20, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'rgba(249,115,22,0.25)' },
  lastresort:   { label: 'Last Resort',  short: '−35%', drop: -35, color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'rgba(239,68,68,0.25)' },
};

export default function ExitGuardianPanel({ assets }: { assets: CryptoAsset[] }) {
  const [level, setLevel] = useState<StopLevel>('balanced');
  if (assets.length === 0) return null;

  const stats = calcPortfolioStats(assets);
  const cfg = STOPS[level];
  const mult = 1 + cfg.drop / 100;

  const stopValue   = stats.totalValue * mult;
  const lossAtStop  = stopValue - stats.totalInvested;
  const lossAtStopPct = stats.totalInvested > 0 ? (lossAtStop / stats.totalInvested) * 100 : 0;
  const gainNow     = stats.totalValue > 0     ? Math.max(0, (stats.totalInvested / stats.totalValue - 1) * 100)  : 0;
  const gainAtStop  = stopValue > 0            ? Math.max(0, (stats.totalInvested / stopValue - 1) * 100)          : 0;
  const isProfit    = stats.totalUnrealizedPnL >= 0;

  return (
    <GlassCard className="p-4 h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Exit Guardian
        </h2>
        {/* Stop level chips */}
        <div className="flex items-center gap-1">
          {(Object.entries(STOPS) as [StopLevel, typeof cfg][]).map(([key, c]) => (
            <button key={key} onClick={() => setLevel(key)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                level === key ? `${c.bg} ${c.color} border` : 't-3 border hover:t-1'
              }`}
              style={{ borderColor: level === key ? c.border : 'var(--border)' }}>
              {c.short}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio stop summary */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] t-3 mb-0.5">Stop triggers at</div>
          <div className={`text-sm font-bold ${cfg.color}`}>{fmtCurrency(stopValue)}</div>
          <div className="text-[10px] t-3 mt-0.5">{cfg.drop}% from {fmtCurrency(stats.totalValue)}</div>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] t-3 mb-0.5">Loss if triggered</div>
          <div className="text-sm font-bold text-red-500">{fmtCurrency(lossAtStop)}</div>
          <div className="text-[10px] t-3 mt-0.5">{lossAtStopPct.toFixed(1)}% of invested</div>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] t-3 mb-0.5">Need to recover now</div>
          <div className={`text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-orange-500'}`}>
            {isProfit ? '✓ In profit' : `+${gainNow.toFixed(1)}%`}
          </div>
          <div className="text-[10px] t-3 mt-0.5">from current value</div>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="text-[10px] t-3 mb-0.5">Need to recover if stop hits</div>
          <div className="text-sm font-bold text-red-500">+{gainAtStop.toFixed(1)}%</div>
          <div className="text-[10px] t-3 mt-0.5">from stop price</div>
        </div>
      </div>

      {/* Per-asset rows */}
      <div className="border-t pt-3 flex-1" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] t-3 uppercase tracking-wider font-medium mb-2">Per Position</div>
        <div className="space-y-1.5">
          {assets.map((asset) => {
            const gainNeededNow = asset.currentPrice > 0
              ? Math.max(0, (asset.entryPrice / asset.currentPrice - 1) * 100) : 0;
            const stopPrice = asset.currentPrice * mult;
            const gainAtStopAsset = stopPrice > 0
              ? Math.max(0, (asset.entryPrice / stopPrice - 1) * 100) : 0;
            // Point of no return = needs 5x (400%) to recover
            const noReturn = gainNeededNow >= 400;
            const isPos = gainNeededNow === 0;

            return (
              <div key={asset.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'var(--surface-deep)', border: `1px solid ${noReturn ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: asset.color + '22', border: `1px solid ${asset.color}44`, color: asset.color }}>
                  {asset.symbol.slice(0, 2)}
                </div>
                {/* Symbol */}
                <div className="w-12 flex-shrink-0">
                  <div className="text-xs font-semibold t-1">{asset.symbol}</div>
                </div>
                {/* Stop price */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] t-3">Stop @ <span className={`font-semibold ${cfg.color}`}>{fmtCurrency(stopPrice)}</span></div>
                </div>
                {/* Recovery columns */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[9px] t-3">Now</div>
                      <div className={`text-[11px] font-bold ${isPos ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {isPos ? '✓' : `+${gainNeededNow.toFixed(0)}%`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] t-3">If stop</div>
                      <div className="text-[11px] font-bold text-red-500">+{gainAtStopAsset.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
                {/* No return warning */}
                {noReturn && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

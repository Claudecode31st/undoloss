'use client';
import { useState } from 'react';
import { Scissors, Anchor, TrendingDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcPortfolioStats, fmtCurrency } from '@/lib/calculations';

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
  const pnlPct = inv > 0 ? ((cur - inv) / inv) * 100 : 0;
  const drawdown = Math.abs(Math.min(pnlPct, 0));
  const lossAmt = cur - inv;

  const holdReq = pctGainNeeded(inv, cur);
  const cutPool = cur + freshCapital;
  const cutReq = inv > cutPool ? pctGainNeeded(inv, cutPool) : 0;
  const cutAlreadyBE = inv <= cutPool;
  const dcaNewInv = inv + freshCapital;
  const dcaPool = cur + freshCapital;
  const dcaReq = dcaNewInv > dcaPool ? pctGainNeeded(dcaNewInv, dcaPool) : 0;
  const dcaAlreadyBE = dcaNewInv <= dcaPool;

  const perAssetBudget = freshCapital / Math.max(assets.length, 1);
  const sorted = [...assets].sort((a, b) => b.currentPrice * b.amount - a.currentPrice * a.amount);

  const paths = [
    {
      icon: Scissors, label: 'Cut & Restart', sub: 'Sell all, redeploy', color: 'text-red-500',
      bg: 'bg-red-500/10', border: 'rgba(239,68,68,0.2)',
      metric: cutAlreadyBE ? null : cutReq,
      pool: fmtCurrency(cutPool),
      already: cutAlreadyBE,
      note: `Realized loss: ${fmtCurrency(lossAmt)}`,
    },
    {
      icon: Anchor, label: 'Hold', sub: 'Wait it out, $0 new', color: 'text-orange-500',
      bg: 'bg-orange-500/10', border: 'rgba(251,146,60,0.2)',
      metric: holdReq,
      pool: fmtCurrency(cur),
      already: holdReq <= 0,
      note: `Current value: ${fmtCurrency(cur)}`,
    },
    {
      icon: TrendingDown, label: 'Average Down', sub: `Deploy ${fmtCurrency(freshCapital, 0)}`, color: 'text-emerald-500',
      bg: 'bg-emerald-500/10', border: 'rgba(34,197,94,0.2)',
      metric: dcaAlreadyBE ? null : dcaReq,
      pool: fmtCurrency(dcaPool),
      already: dcaAlreadyBE,
      note: freshCapital > 0 && !dcaAlreadyBE
        ? `Saves ${(holdReq - dcaReq).toFixed(1)}pp vs hold`
        : 'Set capital > $0 to see impact',
    },
  ];

  return (
    <GlassCard className="p-4">
      {/* Header + slider inline */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Recovery Paths
          </h2>
          <div className="text-[10px] t-3 mt-0.5">
            Drawdown <span className="text-red-500 font-semibold">−{drawdown.toFixed(1)}%</span>
            <span className="mx-1.5">·</span>
            Loss <span className="text-red-500 font-semibold">{fmtCurrency(lossAmt)}</span>
            <span className="mx-1.5">·</span>
            Hold needs <span className="text-orange-500 font-semibold">+{holdReq.toFixed(1)}%</span>
          </div>
        </div>
        {/* Compact capital slider */}
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

      {/* Three path cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {paths.map(({ icon: Icon, label, sub, color, bg, border, metric, pool, already, note }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={13} className={color} />
              </div>
              <div>
                <div className="text-xs font-semibold t-1 leading-tight">{label}</div>
                <div className="text-[9px] t-3 leading-tight">{sub}</div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[9px] t-3">Pool</div>
                <div className="text-xs font-semibold t-2">{pool}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] t-3">Need</div>
                {already
                  ? <div className="text-xs font-bold text-emerald-500">✓ Covered</div>
                  : <div className={`text-sm font-bold ${color}`}>+{metric?.toFixed(1)}%</div>
                }
              </div>
            </div>
            <div className="mt-2 text-[9px] t-3 leading-relaxed">{note}</div>
          </div>
        ))}
      </div>

      {/* Per-asset buy zones — compact rows */}
      <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] t-3 uppercase tracking-wider font-medium mb-2">
          Per-Asset Buy Zones
          <span className="ml-1.5 normal-case font-normal">({fmtCurrency(perAssetBudget, 0)} budget each)</span>
        </div>
        <div className="space-y-2">
          {sorted.map((asset) => {
            const assetCost = asset.entryPrice * asset.amount;
            const assetGainNeeded = asset.currentPrice > 0
              ? Math.max(0, ((asset.entryPrice / asset.currentPrice) - 1) * 100)
              : 0;
            const stageCapital = perAssetBudget / 3;
            const zones = [0, -10, -20].map((dropPct) => {
              const zp = asset.currentPrice * (1 + dropPct / 100);
              return { dropPct, price: zp, deploy: stageCapital };
            });

            // New avg after deploying all 3 stages
            const extraTokens = zones.reduce((s, z) => s + (z.price > 0 ? z.deploy / z.price : 0), 0);
            const newTotalTokens = asset.amount + extraTokens;
            const newTotalCost = assetCost + perAssetBudget;
            const newAvg = newTotalTokens > 0 ? newTotalCost / newTotalTokens : 0;
            const newNeed = asset.currentPrice > 0 ? Math.max(0, ((newAvg / asset.currentPrice) - 1) * 100) : 0;

            return (
              <div key={asset.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                {/* Asset id */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: asset.color + '22', border: `1px solid ${asset.color}44`, color: asset.color }}>
                  {asset.symbol.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold t-1">{asset.symbol}</span>
                    <span className="text-[9px] t-3">BE @ {fmtCurrency(asset.entryPrice)} · needs +{assetGainNeeded.toFixed(1)}%</span>
                  </div>
                  {/* Zone chips */}
                  <div className="flex gap-1.5">
                    {zones.map((z) => (
                      <div key={z.dropPct} className="rounded-lg px-2 py-1 text-center"
                        style={{
                          background: z.dropPct === 0 ? 'rgba(59,130,246,0.1)' : z.dropPct === -10 ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${z.dropPct === 0 ? 'rgba(59,130,246,0.25)' : z.dropPct === -10 ? 'rgba(249,115,22,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        }}>
                        <div className="text-[8px] font-medium" style={{ color: z.dropPct === 0 ? '#3b82f6' : z.dropPct === -10 ? '#f97316' : '#ef4444' }}>
                          {z.dropPct === 0 ? 'Now' : `${z.dropPct}%`}
                        </div>
                        <div className="text-[9px] font-bold t-1">{fmtCurrency(z.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* After full DCA */}
                <div className="text-right flex-shrink-0">
                  <div className="text-[9px] t-3">After DCA</div>
                  <div className="text-xs font-semibold t-1">{fmtCurrency(newAvg)} avg</div>
                  <div className="text-[9px] text-emerald-500 font-medium">need +{newNeed.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

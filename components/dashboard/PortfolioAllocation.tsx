'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcAllocation, calcAssetPnL, calcBreakevenMove, fmtCurrency, fmtPercent } from '@/lib/calculations';

interface PortfolioAllocationProps {
  assets: CryptoAsset[];
}

export default function PortfolioAllocation({ assets }: PortfolioAllocationProps) {
  const allocation = calcAllocation(assets);

  if (assets.length === 0) {
    return (
      <GlassCard className="p-4 flex items-center justify-center min-h-[160px]">
        <p className="t-3 text-sm">Add assets to see breakdown</p>
      </GlassCard>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { symbol: string; percent: number; value: number } }> }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="glass rounded-lg px-2 py-1.5 text-xs shadow-lg">
          <div className="font-semibold t-1">{d.symbol}</div>
          <div className="t-3">{d.percent.toFixed(1)}% · {fmtCurrency(d.value)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-4">
      <h2 className="text-sm font-semibold t-1 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        Portfolio Breakdown
      </h2>

      {/* Pie + legend */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allocation} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={2} dataKey="percent">
                {allocation.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1">
          {allocation.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs t-2">{item.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold t-1">{item.percent.toFixed(1)}%</span>
                <span className="text-[10px] t-3 w-14 text-right">{fmtCurrency(item.value, 0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-asset compact rows */}
      <div className="border-t pt-2.5 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] t-3 uppercase tracking-wider font-medium mb-1.5">Breakeven &amp; Buy Zones</div>
        {assets.map((asset) => {
          const pnl = calcAssetPnL(asset);
          const move = calcBreakevenMove(asset);
          const isShort = asset.direction === 'short';
          const inProfit = pnl.unrealizedPnL >= 0;

          return (
            <div key={asset.id} className="rounded-lg px-2.5 py-2 flex items-center gap-2 flex-wrap"
              style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>

              {/* Avatar + symbol */}
              <div className="flex items-center gap-1.5 min-w-[70px]">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                  style={{ backgroundColor: asset.color + '33', border: `1px solid ${asset.color}55`, color: asset.color }}>
                  {asset.symbol.slice(0, 2)}
                </div>
                <span className="text-xs font-semibold t-1">{asset.symbol}</span>
                <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full leading-none ${isShort ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-600'}`}>
                  {isShort ? 'S' : 'L'}
                </span>
              </div>

              {/* P&L */}
              <div className={`text-xs font-bold tabular-nums min-w-[50px] ${inProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtPercent(pnl.unrealizedPnLPercent)}
              </div>

              {/* Breakeven */}
              <div className={`text-[10px] font-semibold flex-1 ${inProfit ? 'text-emerald-500' : 'text-orange-500'}`}>
                {inProfit ? '✓ Profit' : `${isShort ? '↓' : '↑'}${Math.abs(move).toFixed(1)}% to BE`}
              </div>

              {/* Buy zone chips (long only) */}
              {!isShort && (
                <div className="flex gap-1">
                  {[
                    { pct: '-10%', price: asset.currentPrice * 0.90, c: '#22c55e' },
                    { pct: '-20%', price: asset.currentPrice * 0.80, c: '#f97316' },
                    { pct: '-30%', price: asset.currentPrice * 0.70, c: '#ef4444' },
                  ].map((z) => (
                    <div key={z.pct} className="rounded px-1.5 py-0.5 text-center"
                      style={{ background: z.c + '18', border: `1px solid ${z.c}35` }}>
                      <div className="text-[8px] font-medium" style={{ color: z.c }}>{z.pct}</div>
                      <div className="text-[9px] font-bold t-1">{fmtCurrency(z.price)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

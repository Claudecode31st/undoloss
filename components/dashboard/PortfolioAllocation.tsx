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
      <GlassCard className="p-4 flex items-center justify-center h-full min-h-[160px]">
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
    <GlassCard className="p-4 h-full flex flex-col">
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

      {/* Per-asset breakeven rows — fills remaining height */}
      <div className="border-t pt-2.5 flex flex-col flex-1" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] t-3 uppercase tracking-wider font-medium mb-1.5">Breakeven per Asset</div>
        <div className="space-y-1.5 flex-1">
          {assets.map((asset) => {
            const pnl = calcAssetPnL(asset);
            const move = calcBreakevenMove(asset);
            const isShort = asset.direction === 'short';
            const inProfit = pnl.unrealizedPnL >= 0;
            const lossPct = Math.abs(Math.min(pnl.unrealizedPnLPercent, 0));

            // Progressive colour based on depth of loss / size of profit
            const barColor = inProfit
              ? '#22c55e'                          // green — in profit
              : lossPct < 10  ? '#eab308'          // yellow — small dip, easy to recover
              : lossPct < 25  ? '#f97316'          // orange — meaningful loss
              :                 '#ef4444';          // red — deep loss, hard to recover

            // Progress bar: how close current price is to entry
            const progress = asset.entryPrice > 0
              ? Math.min(100, Math.max(0, (asset.currentPrice / asset.entryPrice) * 100))
              : 0;

            return (
              <div key={asset.id} className="rounded-lg px-2.5 py-2"
                style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  {/* Avatar + symbol */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                      style={{ backgroundColor: asset.color + '33', border: `1px solid ${asset.color}55`, color: asset.color }}>
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold t-1">{asset.symbol}</span>
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full leading-none ${isShort ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-600'}`}>
                      {isShort ? 'S' : 'L'}
                    </span>
                  </div>
                  {/* ROI % */}
                  <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                    {fmtPercent(pnl.unrealizedPnLPercent)}
                  </span>
                  {/* Breakeven need */}
                  <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: barColor }}>
                    {inProfit ? '✓ Profit' : `${isShort ? '↓' : '↑'}${Math.abs(move).toFixed(1)}% to Breakeven`}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, background: barColor }} />
                </div>
                <div className="flex justify-between text-[9px] t-3 mt-0.5">
                  <span>Entry {fmtCurrency(asset.entryPrice)}</span>
                  <span>Now {fmtCurrency(asset.currentPrice)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

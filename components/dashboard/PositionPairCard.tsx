'use client';
import { PairInfo } from '@/lib/types';
import { fmtUSD, fmtUSDFull, fmtPct, fmtNum } from '@/lib/calculations';
import { Lock, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  pair: PairInfo;
  onEdit?: (id: string) => void;
}

function LegRow({ label, pos, pnl, breakEvenPct, isWorse }: {
  label: string;
  pos: { size: number; entryPrice: number; currentPrice: number; leverage: number };
  pnl: { unrealizedPnL: number; pnlPercent: number; roiPct: number; initialMargin: number };
  breakEvenPct: number;
  isWorse: boolean;
}) {
  const profit = pnl.unrealizedPnL >= 0;
  return (
    <div className="rounded-xl p-3 mb-2" style={{
      background: isWorse ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)',
      border: `1px solid ${isWorse ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)'}`,
    }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            label === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}>{label}</span>
          <span className="text-[11px] t-3">{pos.leverage}× Cross</span>
        </div>
        <div className={`text-sm font-bold ${profit ? 'text-emerald-500' : 'text-red-500'}`}>
          {profit ? '+' : ''}{fmtUSD(pnl.unrealizedPnL)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div>
          <div className="t-3">Size</div>
          <div className="font-semibold t-1">{fmtNum(pos.size, pos.size < 1 ? 3 : 0)}</div>
        </div>
        <div>
          <div className="t-3">Entry</div>
          <div className="font-semibold t-1">${fmtNum(pos.entryPrice, pos.entryPrice > 100 ? 0 : 3)}</div>
        </div>
        <div>
          <div className="t-3">Mark</div>
          <div className="font-semibold t-1">${fmtNum(pos.currentPrice, pos.currentPrice > 100 ? 0 : 3)}</div>
        </div>
        <div>
          <div className="t-3">ROI</div>
          <div className={`font-semibold ${profit ? 'text-emerald-500' : 'text-red-400'}`}>
            {fmtPct(pnl.roiPct)}
          </div>
        </div>
        <div>
          <div className="t-3">Margin</div>
          <div className="font-semibold t-1">{fmtUSD(pnl.initialMargin)}</div>
        </div>
        <div>
          <div className="t-3">Break-even</div>
          <div className="font-semibold" style={{ color: Math.abs(breakEvenPct) < 20 ? '#eab308' : '#f97316' }}>
            {breakEvenPct > 0 ? '+' : ''}{breakEvenPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-1.5 text-[10px] t-3">
        {label === 'LONG'
          ? `Needs ${breakEvenPct.toFixed(1)}% price rise to break even`
          : `Needs ${Math.abs(breakEvenPct).toFixed(1)}% price drop to break even`
        }
      </div>
    </div>
  );
}

export default function PositionPairCard({ pair, onEdit }: Props) {
  const { longPnL, shortPnL } = pair;
  const longIsWorse = Math.abs(longPnL.unrealizedPnL) >= Math.abs(shortPnL.unrealizedPnL);

  // Which leg is cheaper to close (to break the hedge)
  const cheaperLeg = Math.abs(shortPnL.unrealizedPnL) <= Math.abs(longPnL.unrealizedPnL)
    ? 'short' : 'long';
  const cheaperCost = cheaperLeg === 'short' ? shortPnL.unrealizedPnL : longPnL.unrealizedPnL;

  return (
    <div className="glass rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
            style={{ background: pair.color }}>
            {pair.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="font-bold t-1">{pair.symbol}/USDT</div>
            <div className="text-[10px] t-3">Delta-Neutral Pair · Cross 100×</div>
          </div>
        </div>
        {onEdit && (
          <button onClick={() => onEdit(pair.long.id)}
            className="text-[10px] px-2 py-1 rounded-lg t-3 hover:t-1 transition-colors"
            style={{ border: '1px solid var(--border)' }}>Edit</button>
        )}
      </div>

      {/* Legs */}
      <LegRow
        label="LONG"
        pos={{ size: pair.long.size, entryPrice: pair.long.entryPrice, currentPrice: pair.long.currentPrice, leverage: pair.long.leverage }}
        pnl={longPnL}
        breakEvenPct={pair.longPctToBreakEven}
        isWorse={longIsWorse}
      />
      <LegRow
        label="SHORT"
        pos={{ size: pair.short.size, entryPrice: pair.short.entryPrice, currentPrice: pair.short.currentPrice, leverage: pair.short.leverage }}
        pnl={shortPnL}
        breakEvenPct={-pair.shortPctToBreakEven}
        isWorse={!longIsWorse}
      />

      {/* Locked loss insight */}
      <div className="rounded-xl p-3 mt-1" style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
      }}>
        <div className="flex items-center gap-2 mb-1">
          <Lock size={12} className="text-red-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-red-400">Locked Loss — Price Cannot Fix This Pair</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] t-3">Combined pair P&L (fixed constant)</span>
          <span className="text-sm font-bold text-red-500">{fmtUSD(pair.lockedLoss)}</span>
        </div>
        <div className="text-[10px] t-3 mt-1">
          Long + Short = {fmtUSD(longPnL.unrealizedPnL)} + {fmtUSD(shortPnL.unrealizedPnL)} = {fmtUSD(pair.lockedLoss)} regardless of {pair.symbol} price.
        </div>
      </div>

      {/* Quick action hint */}
      <div className="mt-2 flex items-center gap-1.5 text-[10px] t-3">
        {cheaperLeg === 'short'
          ? <TrendingDown size={11} className="text-orange-400" />
          : <TrendingUp size={11} className="text-orange-400" />
        }
        <span>Cheapest leg to close: <strong className="text-orange-400">
          {cheaperLeg.toUpperCase()} at {fmtUSD(cheaperCost)}
        </strong> — frees margin for directional recovery</span>
      </div>
    </div>
  );
}

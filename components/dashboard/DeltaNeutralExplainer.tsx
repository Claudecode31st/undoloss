'use client';
import { PairInfo } from '@/lib/types';
import { fmtUSD } from '@/lib/calculations';
import { Lock, AlertTriangle } from 'lucide-react';

interface Props {
  pairs: PairInfo[];
}

export default function DeltaNeutralExplainer({ pairs }: Props) {
  const totalLocked = pairs.reduce((s, p) => s + p.lockedLoss, 0);

  return (
    <div className="glass rounded-2xl p-4"
      style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>

      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-xl flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Lock size={16} className="text-red-400" />
        </div>
        <div>
          <h3 className="font-bold text-red-400 text-sm">Why Your Losses Are "Locked"</h3>
          <p className="text-[11px] t-3 mt-0.5">
            Understanding this is the first step to getting out
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {pairs.map(p => (
          <div key={p.symbol} className="rounded-lg p-2.5"
            style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-semibold t-1">{p.symbol} Pair Math</span>
              <span className="text-sm font-bold text-red-500">{fmtUSD(p.lockedLoss)}</span>
            </div>
            <div className="text-[10px] t-3 font-mono">
              {p.long.size} × (${p.short.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 3 })} short entry − ${p.long.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} long entry) = {fmtUSD(p.lockedLoss)}
            </div>
            <div className="text-[10px] text-red-400 mt-1">
              This number does NOT change regardless of {p.symbol} price
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-2.5 mb-3"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-bold text-red-400">Total Permanently Locked Loss</span>
          <span className="text-base font-bold text-red-500">{fmtUSD(totalLocked)}</span>
        </div>
        <div className="text-[10px] t-3 mt-1">
          No market movement can change this. You cannot wait your way out of a delta-neutral hedge.
        </div>
      </div>

      <div className="rounded-lg p-2.5"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle size={11} className="text-yellow-400" />
          <span className="text-[11px] font-semibold text-yellow-400">The Only Way Out</span>
        </div>
        <div className="text-[11px] t-2 leading-relaxed">
          You must <strong>break the hedge</strong> by closing one leg. This gives the remaining leg
          directional exposure. Then you need price to move in that direction to recover.
          The question is: <strong>which leg to close, and when?</strong>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Strategy } from '@/lib/types';
import { fmtUSD, fmtUSDFull } from '@/lib/calculations';
import { CheckCircle, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface Props {
  strategies: Strategy[];
  currentEquity: number;
  walletBalance: number;
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={10}
          className={i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'} />
      ))}
    </div>
  );
}

export default function RecoveryStrategies({ strategies, currentEquity, walletBalance }: Props) {
  const [expanded, setExpanded] = useState<string | null>('bear');
  const [selected, setSelected] = useState<string>('bear');

  const stratColor: Record<string, string> = {
    bear: '#3b82f6',
    bull: '#f97316',
    exit: '#a78bfa',
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-4">
        <h2 className="font-bold t-1 text-base">Recovery Strategies</h2>
        <p className="text-[11px] t-3 mt-0.5">
          Your pairs have locked losses — no price move improves both legs simultaneously.
          Choose a strategy to break the hedge and create a path out.
        </p>
      </div>

      <div className="space-y-2">
        {strategies.map(s => {
          const isOpen = expanded === s.id;
          const isSel  = selected === s.id;
          const color  = stratColor[s.id] ?? '#a1a1aa';
          const equityAfterBest = walletBalance + s.immediateRealizedLoss;

          return (
            <div key={s.id}
              className="rounded-xl overflow-hidden transition-all duration-200"
              style={{
                border: `1px solid ${isSel ? color + '55' : 'var(--border)'}`,
                background: isSel ? color + '08' : 'var(--surface-deep)',
              }}>

              {/* Header row */}
              <button
                className="w-full flex items-center gap-3 p-3 text-left"
                onClick={() => { setExpanded(isOpen ? null : s.id); setSelected(s.id); }}
              >
                <span className="text-lg leading-none">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold t-1">{s.name}</span>
                    {s.isRecommended && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] t-3 mt-0.5 truncate">{s.tagline}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Stars n={s.feasibility} />
                  <span className="text-[10px] t-3">Feasibility</span>
                </div>
                {isOpen
                  ? <ChevronUp size={14} className="t-3 flex-shrink-0" />
                  : <ChevronDown size={14} className="t-3 flex-shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Key numbers */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <div className="text-[10px] t-3">Lock in now</div>
                      <div className="text-sm font-bold text-red-500">{fmtUSD(s.immediateRealizedLoss)}</div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                      <div className="text-[10px] t-3">Remaining PnL</div>
                      <div className="text-sm font-bold" style={{ color: s.remainingCurrentPnL >= 0 ? '#22c55e' : '#f97316' }}>
                        {fmtUSD(s.remainingCurrentPnL)}
                      </div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                      <div className="text-[10px] t-3">Best-case equity</div>
                      <div className="text-sm font-bold text-emerald-500">
                        {fmtUSDFull(equityAfterBest)}
                      </div>
                    </div>
                  </div>

                  {/* Price targets */}
                  {s.targets.length > 0 && (
                    <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                      <div className="text-[10px] font-semibold t-2 mb-2">Break-even price targets</div>
                      <div className="space-y-1.5">
                        {s.targets.map(t => (
                          <div key={t.symbol + t.side} className="flex items-center justify-between text-[11px]">
                            <span className="t-3">{t.symbol} {t.side.toUpperCase()}</span>
                            <div className="flex items-center gap-2">
                              <span className="t-3">current: ${t.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                              <span className="font-semibold" style={{ color: t.pctMove > 0 ? '#f97316' : '#3b82f6' }}>
                                → ${t.entryPrice.toLocaleString('en-US', { maximumFractionDigits: t.entryPrice > 100 ? 0 : 3 })}
                                <span className="ml-1 text-[10px]">({t.pctMove > 0 ? '+' : ''}{t.pctMove.toFixed(1)}%)</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  <div>
                    <div className="text-[10px] font-semibold t-2 mb-1.5">Step-by-step</div>
                    <div className="space-y-1">
                      {s.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] t-2">
                          <CheckCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: color }} />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk vs upside */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-lg p-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <div className="text-[10px] font-semibold text-red-400 mb-1">⚠ Risk</div>
                      <div className="text-[11px] t-3">{s.risk}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                      <div className="text-[10px] font-semibold text-emerald-400 mb-1">✓ Upside</div>
                      <div className="text-[11px] t-3">{s.upside}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

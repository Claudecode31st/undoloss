'use client';
import { Shield, Snowflake, CheckCircle2, Activity } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { StrategyResult } from '@/lib/types';
import { fmtCurrency } from '@/lib/calculations';

interface RecoveryPlanCardProps {
  result: StrategyResult;
  hedgeRatio: number;
  onHedgeChange: (ratio: number) => void;
}

const actionStyles = {
  hold:     { bar: 'bg-blue-500',    card: 'bg-blue-500/8 border-blue-500/20',    text: 'text-blue-600 dark:text-blue-400' },
  dca:      { bar: 'bg-emerald-500', card: 'bg-emerald-500/8 border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
  hedge:    { bar: 'bg-indigo-500',  card: 'bg-indigo-500/8 border-indigo-500/20',  text: 'text-indigo-600 dark:text-indigo-400' },
  reduce:   { bar: 'bg-orange-500',  card: 'bg-orange-500/8 border-orange-500/20',  text: 'text-orange-600 dark:text-orange-400' },
  reassess: { bar: 'bg-zinc-400',    card: 'border-[var(--border)]',                text: 't-2' },
};

export default function RecoveryPlanCard({ result, hedgeRatio, onHedgeChange }: RecoveryPlanCardProps) {
  const exposureGaugeAngle = Math.max(0, Math.min(180, (result.netExposurePercent / 100) * 180));
  const exposureColor = result.netExposurePercent < 20 ? '#22c55e' : result.netExposurePercent < 60 ? '#f97316' : '#ef4444';

  return (
    <GlassCard className="p-4 md:p-5 h-full flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          Recovery Plan Card
        </h2>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-semibold">
          Active Plan
        </span>
      </div>

      {/* Metric rows */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>

        {/* Net Exposure */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 flex-shrink-0">
            <svg viewBox="0 0 64 36" className="w-full h-full">
              <path d="M4 32 A 28 28 0 0 1 60 32" fill="none" stroke="var(--border-strong)" strokeWidth="7" strokeLinecap="round" />
              <path d="M4 32 A 28 28 0 0 1 60 32" fill="none" stroke={exposureColor} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${(exposureGaugeAngle / 180) * 88} 88`} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] t-3 leading-none mb-0.5">Net Exposure</div>
            <div className="text-sm font-bold t-1">{result.netExposureLabel}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-semibold" style={{ color: exposureColor }}>{result.netExposurePercent.toFixed(1)}%</div>
            <div className="text-[10px] t-3">exposure</div>
          </div>
        </div>

        {/* Hedge Status */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Shield size={15} className="text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] t-3 leading-none mb-0.5">Hedge Status</div>
            <div className="text-sm font-bold text-indigo-500">{result.hedgeStatus}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs t-2">{fmtCurrency(result.longValue)}</div>
            <div className="text-[10px] t-3">long</div>
          </div>
        </div>

        {/* Portfolio Freeze Zone */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            result.freezeZoneActive ? 'bg-blue-500/10 border border-blue-500/20' : 'border'
          }`} style={!result.freezeZoneActive ? { borderColor: 'var(--border)' } : undefined}>
            <Snowflake size={15} style={{ color: result.freezeZoneActive ? '#3b82f6' : 'var(--text-3)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] t-3 leading-none mb-0.5">Portfolio Freeze Zone</div>
            <div className="text-sm font-bold" style={{ color: result.freezeZoneActive ? '#3b82f6' : 'var(--text-3)' }}>
              {result.freezeZoneActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          {result.freezeZoneActive && (
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] text-blue-500 font-medium">Volatility</div>
              <div className="text-[10px] t-3">reduced</div>
            </div>
          )}
        </div>
      </div>

      {/* Hedge ratio slider — only for delta-neutral */}
      {result.mode === 'delta-neutral' && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium t-2">Hedge Ratio</span>
            <span className="text-sm font-bold text-indigo-500">{hedgeRatio}%</span>
          </div>
          <input
            type="range" min="0" max="100" step="5" value={hedgeRatio}
            onChange={(e) => onHedgeChange(Number(e.target.value))}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-full h-2 appearance-none rounded-full cursor-pointer"
            style={{ background: `linear-gradient(to right, #6366f1 ${hedgeRatio}%, var(--border-strong) ${hedgeRatio}%)`, touchAction: 'none' }}
          />
          <div className="flex justify-between text-[10px] t-3 mt-2">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
      )}

      {/* Recommended actions */}
      <div className="flex-1">
        <div className="text-[10px] t-3 font-semibold uppercase tracking-widest mb-3">Next 3 Recommended Actions</div>
        <div className="space-y-2.5">
          {result.actions.slice(0, 3).map((action) => {
            const s = actionStyles[action.type] ?? actionStyles.reassess;
            return (
              <div key={action.order}
                className={`flex gap-3 p-3 rounded-xl border ${s.card}`}
                style={action.type === 'reassess' ? { background: 'var(--surface-deep)' } : undefined}>
                {/* Left: number + color bar */}
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${s.bar}`}>
                    {action.order}
                  </span>
                  <div className={`w-0.5 flex-1 rounded-full opacity-30 ${s.bar}`} />
                </div>
                {/* Right: content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className={`text-xs font-semibold leading-snug mb-1 ${s.text}`}>{action.title}</div>
                  <div className="text-[11px] t-3 leading-relaxed">{action.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] t-3 text-center">Structured plan — not financial advice.</p>
    </GlassCard>
  );
}

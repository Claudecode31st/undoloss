'use client';
import { Shield, TrendingUp, Snowflake, CheckCircle2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { StrategyResult } from '@/lib/types';
import { fmtCurrency } from '@/lib/calculations';

interface RecoveryPlanCardProps {
  result: StrategyResult;
  hedgeRatio: number;
  onHedgeChange: (ratio: number) => void;
}

const actionColors = {
  hold: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  dca: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  hedge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
  reduce: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
  reassess: 'bg-zinc-700/30 border-zinc-600/40 text-zinc-300',
};

export default function RecoveryPlanCard({ result, hedgeRatio, onHedgeChange }: RecoveryPlanCardProps) {
  const exposureGaugeAngle = Math.max(0, Math.min(180, (result.netExposurePercent / 100) * 180));

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          Recovery Plan Card
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
          Active Plan
        </span>
      </div>

      {/* Three key metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Net Exposure */}
        <div className="glass-dark rounded-xl p-3 text-center">
          <div className="text-[10px] text-zinc-500 mb-2">Net Exposure</div>
          <div className="relative w-16 h-9 mx-auto mb-1">
            <svg viewBox="0 0 64 32" className="w-full h-full">
              <path d="M4 30 A 28 28 0 0 1 60 30" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
              <path
                d="M4 30 A 28 28 0 0 1 60 30"
                fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(exposureGaugeAngle / 180) * 88} 88`}
              />
            </svg>
          </div>
          <div className="text-sm font-bold text-white">{result.netExposureLabel}</div>
          <div className="text-[10px] text-zinc-500">Exposure: {result.netExposurePercent.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-400">(Well Balanced)</div>
        </div>

        {/* Hedge Status */}
        <div className="glass-dark rounded-xl p-3 text-center">
          <div className="text-[10px] text-zinc-500 mb-2">Hedge Status</div>
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Shield size={18} className="text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-indigo-300">{result.hedgeStatus}</div>
          <div className="text-[10px] text-zinc-500">Long: {fmtCurrency(result.longValue)}</div>
          <div className="text-[10px] text-zinc-500">Hedge: {fmtCurrency(result.hedgeValue)}</div>
        </div>

        {/* Portfolio Freeze Zone */}
        <div className="glass-dark rounded-xl p-3 text-center">
          <div className="text-[10px] text-zinc-500 mb-2">Portfolio Freeze Zone</div>
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Snowflake size={18} className={result.freezeZoneActive ? 'text-blue-400' : 'text-zinc-600'} />
          </div>
          <div className={`text-sm font-bold ${result.freezeZoneActive ? 'text-blue-300' : 'text-zinc-500'}`}>
            {result.freezeZoneActive ? 'Active' : 'Inactive'}
          </div>
          {result.freezeZoneActive && (
            <div className="text-[10px] text-zinc-500">Volatility Impact<br />Reduced</div>
          )}
        </div>
      </div>

      {/* Hedge slider (for delta-neutral mode) */}
      {result.mode === 'delta-neutral' && (
        <div className="mb-4 p-3 glass-dark rounded-xl">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-zinc-500">Hedge Ratio</span>
            <span className="text-xs font-bold text-indigo-300">{hedgeRatio}%</span>
          </div>
          <input
            type="range" min="0" max="100" step="5" value={hedgeRatio}
            onChange={(e) => onHedgeChange(Number(e.target.value))}
            className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
            style={{ background: `linear-gradient(to right, #6366f1 ${hedgeRatio}%, #27272a ${hedgeRatio}%)` }}
          />
          <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
      )}

      {/* Next 3 actions */}
      <div className="flex-1">
        <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide mb-2">Next 3 Recommended Actions</div>
        <div className="grid grid-cols-3 gap-2">
          {result.actions.slice(0, 3).map((action) => (
            <div
              key={action.order}
              className={`rounded-xl p-3 border flex flex-col gap-1 ${actionColors[action.type]}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {action.order}
                </span>
                <CheckCircle2 size={11} />
              </div>
              <div className="text-[11px] font-semibold leading-tight">{action.title}</div>
              <div className="text-[9px] opacity-80 leading-tight">{action.description}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[9px] text-zinc-600 text-center mt-3">This is a structured plan, not financial advice.</p>
    </GlassCard>
  );
}

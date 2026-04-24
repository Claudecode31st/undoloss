'use client';
import { TrendingUp, Target, ShieldOff, ArrowLeftRight, Shield } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { StrategyMode as TStrategyMode, RiskMode } from '@/lib/types';

const strategies: { mode: TStrategyMode; name: string; desc: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { mode: 'dca', name: 'DCA Recovery', desc: 'Gradual averaging to lower entry', icon: TrendingUp },
  { mode: 'breakeven', name: 'Break-even Planning', desc: 'Plan exit near breakeven zone', icon: Target },
  { mode: 'risk-reduction', name: 'Risk Reduction', desc: 'Reduce exposure & protect capital', icon: ShieldOff },
  { mode: 'swing', name: 'Swing Re-entry', desc: 'Sell high, rebuy lower', icon: ArrowLeftRight },
  { mode: 'delta-neutral', name: 'Delta-Neutral Hedging', desc: 'Hedge to reduce market exposure', icon: Shield },
];

const riskModes: { mode: RiskMode; label: string }[] = [
  { mode: 'conservative', label: 'Conservative' },
  { mode: 'balanced', label: 'Balanced' },
  { mode: 'aggressive', label: 'Aggressive' },
];

interface StrategyModeProps {
  strategy: TStrategyMode;
  riskMode: RiskMode;
  onStrategyChange: (s: TStrategyMode) => void;
  onRiskModeChange: (r: RiskMode) => void;
}

export default function StrategyMode({ strategy, riskMode, onStrategyChange, onRiskModeChange }: StrategyModeProps) {
  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <h2 className="text-sm font-semibold t-1 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        Strategy Mode
      </h2>

      <div className="space-y-1.5 flex-1">
        {strategies.map(({ mode, name, desc, icon: Icon }) => {
          const active = strategy === mode;
          return (
            <button key={mode} onClick={() => onStrategyChange(mode)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 ${active ? 'nav-active' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
              <Icon size={14} className={active ? 'text-orange-500' : 't-3'} />
              <div>
                <div className="text-xs font-medium" style={{ color: active ? '#f97316' : 'var(--text-2)' }}>{name}</div>
                <div className="text-[10px] t-3">{desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-[10px] t-3 mb-2 font-medium uppercase tracking-wide">Risk Tolerance</div>
        <div className="grid grid-cols-3 gap-1">
          {riskModes.map(({ mode, label }) => (
            <button key={mode} onClick={() => onRiskModeChange(mode)}
              className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
                riskMode === mode
                  ? 'bg-orange-500 text-white border border-orange-500 shadow-sm'
                  : 'border t-2 hover:border-orange-400/50'
              }`}
              style={riskMode !== mode ? { borderColor: 'var(--border)', background: 'var(--surface-deep)' } : undefined}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

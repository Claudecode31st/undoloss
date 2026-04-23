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
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        Strategy Mode
      </h2>

      <div className="space-y-1.5 flex-1">
        {strategies.map(({ mode, name, desc, icon: Icon }) => {
          const active = strategy === mode;
          return (
            <button
              key={mode}
              onClick={() => onStrategyChange(mode)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 ${
                active
                  ? 'nav-active'
                  : 'hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={14} className={active ? 'text-orange-400' : 'text-zinc-500'} />
              <div>
                <div className={`text-xs font-medium ${active ? 'text-orange-300' : 'text-zinc-300'}`}>{name}</div>
                <div className="text-[10px] text-zinc-500">{desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800/50">
        <div className="text-[10px] text-zinc-500 mb-2 font-medium uppercase tracking-wide">Risk Tolerance</div>
        <div className="grid grid-cols-3 gap-1">
          {riskModes.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => onRiskModeChange(mode)}
              className={`py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 ${
                riskMode === mode
                  ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                  : 'bg-zinc-800/40 border border-zinc-700/40 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { ScenarioOutcome } from '@/lib/types';

const icons = { TrendingUp, TrendingDown, Minus };

interface ScenarioOutlookProps {
  scenarios: ScenarioOutcome[];
}

export default function ScenarioOutlook({ scenarios }: ScenarioOutlookProps) {
  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <h2 className="text-sm font-semibold t-1 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Scenario Outlook
      </h2>

      <div className="space-y-2.5 flex-1">
        {scenarios.map((s) => {
          const Icon = icons[s.icon as keyof typeof icons] ?? TrendingUp;
          const returnStr = s.returnRangeLow >= 0
            ? `+${s.returnRangeLow}% to +${s.returnRangeHigh}%`
            : `${s.returnRangeLow}% to +${s.returnRangeHigh}%`;
          const timeStr = s.recoveryTimeHigh ? `${s.recoveryTimeLow} - ${s.recoveryTimeHigh} Months` : `${s.recoveryTimeLow}+ Months`;

          return (
            <div key={s.scenario} className="flex items-center gap-3 p-3 glass-dark rounded-xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                s.scenario === 'bull' ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : s.scenario === 'sideways' ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <Icon size={14} className={s.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold t-1 truncate">{s.name}</div>
                  <div className={`text-xs font-bold flex-shrink-0 ${s.color}`}>{returnStr}</div>
                </div>
                <div className="text-[10px] t-3">Recovery Time: {timeStr}</div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${s.badgeColor}`}>
                {s.difficulty}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] t-3 text-center mt-3">Scenarios are based on historical behavior, not predictions.</p>
    </GlassCard>
  );
}

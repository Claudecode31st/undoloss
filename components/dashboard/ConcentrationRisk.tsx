'use client';
import GlassCard from '@/components/ui/GlassCard';
import { RiskScore } from '@/lib/types';

interface ConcentrationRiskProps {
  risk: RiskScore;
}

export default function ConcentrationRisk({ risk }: ConcentrationRiskProps) {
  const color = risk.concentrationRisk === 'High' ? 'text-red-400'
    : risk.concentrationRisk === 'Moderate' ? 'text-yellow-400'
    : 'text-emerald-400';

  return (
    <GlassCard className="p-4 mt-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Concentration Risk</div>
          <div className={`text-sm font-semibold ${color}`}>{risk.concentrationRisk}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 mb-1">Top 2 assets:</div>
          <div className="text-sm font-semibold text-white">{risk.top2AssetsPercent.toFixed(1)}%</div>
        </div>
      </div>
    </GlassCard>
  );
}

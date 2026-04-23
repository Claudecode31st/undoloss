'use client';
import GlassCard from '@/components/ui/GlassCard';
import { RiskScore } from '@/lib/types';

interface ConcentrationRiskProps {
  risk: RiskScore;
}

export default function ConcentrationRisk({ risk }: ConcentrationRiskProps) {
  const color = risk.concentrationRisk === 'High' ? 'text-red-500'
    : risk.concentrationRisk === 'Moderate' ? 'text-yellow-500'
    : 'text-emerald-500';

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs t-3 mb-1">Concentration Risk</div>
          <div className={`text-sm font-semibold ${color}`}>{risk.concentrationRisk}</div>
        </div>
        <div className="text-right">
          <div className="text-xs t-3 mb-1">Top 2 assets:</div>
          <div className="text-sm font-semibold t-1">{risk.top2AssetsPercent.toFixed(1)}%</div>
        </div>
      </div>
    </GlassCard>
  );
}

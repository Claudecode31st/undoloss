'use client';
import { AlertTriangle, Zap, Target, Heart } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { BehavioralWarning } from '@/lib/types';

const icons = { AlertTriangle, Zap, Target };

interface BehavioralGuardProps {
  warnings: BehavioralWarning[];
}

export default function BehavioralGuard({ warnings }: BehavioralGuardProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
            <Heart size={14} className="text-pink-500" />
          </div>
          <div>
            <div className="text-xs font-semibold t-1">Behavioral Guard</div>
            <div className="text-[10px] t-3">Discipline protects your capital.</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {warnings.map((w) => {
            const Icon = icons[w.icon as keyof typeof icons] ?? AlertTriangle;
            const bgColor = w.level === 'High' ? 'bg-red-500/10 border-red-500/20'
              : w.level === 'Moderate' ? 'bg-yellow-500/10 border-yellow-500/20'
              : 'bg-emerald-500/10 border-emerald-500/20';
            return (
              <div key={w.type} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bgColor}`}>
                <Icon size={13} className={w.color} />
                <div>
                  <div className={`text-[11px] font-semibold ${w.color}`}>{w.name}</div>
                  <div className={`text-[10px] ${w.color}`}>{w.level}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] t-3 md:text-right flex-shrink-0 hidden md:block">
          Stay patient. Stick to the plan.<br />
          <span className="t-3">Emotions are the biggest risk.</span>
        </div>
      </div>
    </GlassCard>
  );
}

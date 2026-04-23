'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import { AllocationItem } from '@/lib/types';

interface PortfolioAllocationProps {
  allocation: AllocationItem[];
}

export default function PortfolioAllocation({ allocation }: PortfolioAllocationProps) {
  if (allocation.length === 0) {
    return (
      <GlassCard className="p-4 flex items-center justify-center h-full min-h-[200px]">
        <p className="text-zinc-500 text-sm">Add assets to see allocation</p>
      </GlassCard>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: AllocationItem }> }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass rounded-lg px-3 py-2 text-xs">
          <div className="font-semibold text-white">{d.symbol}</div>
          <div className="text-zinc-400">{d.percent.toFixed(1)}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-4 h-full">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        Portfolio Allocation
      </h2>

      <div className="flex items-center gap-4">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                paddingAngle={2}
                dataKey="percent"
              >
                {allocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5">
          {allocation.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-zinc-300">{item.symbol}</span>
              </div>
              <span className="text-xs font-semibold text-white">{item.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

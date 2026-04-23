'use client';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  marketStatus?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function Header({ title, subtitle, lastUpdated, marketStatus = 'Neutral', onRefresh, refreshing }: HeaderProps) {
  const time = lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-white gradient-text">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
          <span className="text-xs text-zinc-300">Market: {marketStatus}</span>
        </div>
        <span className="text-xs text-zinc-500">Last updated: {time}</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 glass rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}

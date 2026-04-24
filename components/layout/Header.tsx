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
  const time = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="flex items-center justify-between mb-5 gap-3 min-w-0">
      {/* Title — subtitle hidden on mobile */}
      <div className="min-w-0">
        <h1 className="text-lg font-bold gradient-text leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] t-3 mt-0.5 hidden sm:block">{subtitle}</p>}
      </div>

      {/* Right side — all on one line */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 glass rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot flex-shrink-0" />
          <span className="text-xs t-2 whitespace-nowrap">{marketStatus}</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl t-2 hover:text-orange-400 transition-colors disabled:opacity-50 flex-shrink-0 active:scale-95"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="text-xs t-3 whitespace-nowrap">{refreshing ? 'Updating…' : time}</span>
          </button>
        )}
      </div>
    </div>
  );
}

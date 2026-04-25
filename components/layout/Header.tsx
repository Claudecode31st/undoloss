'use client';
import { RefreshCw, Check } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  savedFlash?: boolean;
}

export default function Header({ title, subtitle, lastUpdated, onRefresh, refreshing, savedFlash }: HeaderProps) {
  const time = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="flex items-center justify-between mb-5 gap-3 min-w-0">
      {/* Title */}
      <div className="min-w-0">
        <h1 className="text-lg font-bold gradient-text leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] t-3 mt-0.5 hidden sm:block">{subtitle}</p>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`flex items-center gap-1 text-[11px] font-medium text-emerald-500 transition-all duration-300 ${savedFlash ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
          <Check size={11} /> Saved
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 glass rounded-full t-2 hover:text-orange-400 transition-colors disabled:opacity-50 flex-shrink-0 active:scale-95"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="text-xs t-2 whitespace-nowrap">{refreshing ? 'Updating…' : time}</span>
          </button>
        )}
      </div>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, Target, Shield, FileText,
  TrendingUp, Clock, Settings, HelpCircle, Cpu, Heart
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/strategies', label: 'Strategies', icon: Target },
  { href: '/risk-dashboard', label: 'Risk Dashboard', icon: Shield },
  { href: '/recovery-plan', label: 'Recovery Plan', icon: FileText },
  { href: '/scenario-simulator', label: 'Scenario Simulator', icon: TrendingUp },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-48 glass-dark flex flex-col z-40 border-r border-zinc-800/50">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Cpu size={16} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Crypto Capital</div>
            <div className="text-[10px] text-zinc-500 leading-tight">Recovery System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                active
                  ? 'nav-active text-orange-300 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={15} className={active ? 'text-orange-400' : ''} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Donate */}
      <div className="p-3 border-t border-zinc-800/50">
        <p className="text-[10px] text-zinc-500 text-center mb-2 leading-tight">
          If this tool helped you,<br />feel free to support ❤️
        </p>
        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600/30 to-rose-600/30 border border-pink-500/30 text-pink-300 text-xs font-medium hover:from-pink-600/40 hover:to-rose-600/40 transition-all duration-200">
          <Heart size={12} fill="currentColor" />
          Donate
        </button>
      </div>
    </aside>
  );
}

'use client';
import Link from 'next/link';
import { Undo2 } from 'lucide-react';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarDays,
  Settings, HelpCircle, Heart, Sun, Moon
} from 'lucide-react';

const nav = [
  { href: '/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dca-planner', label: 'Average Down', icon: CalendarDays },
  { href: '/settings',    label: 'Settings',    icon: Settings },
  { href: '/help',        label: 'Help',        icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDark = theme === 'dark';

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-48 glass-dark flex-col z-40 border-r"
      style={{ borderColor: 'var(--border)' }}>
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Undo2 size={15} className="text-white" strokeWidth={2.5} />
        </div>
          <div>
            <div className="text-sm font-bold leading-tight t-1">Undo Loss</div>
            <div className="text-[10px] leading-tight t-3">Recovery System</div>
          </div>
        </Link>
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
                active ? 'nav-active font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: active ? '#f97316' : 'var(--text-2)' }}
            >
              <Icon size={15} style={{ color: active ? '#f97316' : 'var(--text-3)' }} />
              <span style={{ color: active ? undefined : 'var(--text-2)' }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle + Donate */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ border: '1px solid var(--border)' }}
          >
            <span className="text-xs t-2">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            <div className="relative w-9 h-5 rounded-full transition-colors duration-300"
              style={{ background: isDark ? '#f97316' : '#d1d5db' }}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`}>
                {isDark ? <Moon size={9} className="text-orange-500" /> : <Sun size={9} className="text-yellow-500" />}
              </div>
            </div>
          </button>
        )}
        <p className="text-[10px] t-3 text-center leading-tight">
          If this tool helped you,<br />feel free to support ❤️
        </p>
        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600/30 to-rose-600/30 border border-pink-500/30 text-pink-400 text-xs font-medium hover:from-pink-600/40 hover:to-rose-600/40 transition-all duration-200">
          <Heart size={12} fill="currentColor" />
          Donate
        </button>
      </div>
    </aside>
  );
}

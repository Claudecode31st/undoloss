'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, CalendarDays,
  MoreHorizontal, Settings, HelpCircle, Coffee, Sun, Moon, X
} from 'lucide-react';

const primary = [
  { href: '/dashboard',   label: 'Home', icon: LayoutDashboard },
  { href: '/dca-planner', label: 'Avg Down', icon: CalendarDays },
];

const more = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help',     label: 'Help',     icon: HelpCircle },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isDark = theme === 'dark';
  const moreActive = more.some(item => pathname === item.href);

  return (
    <>
      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-dark border-t flex items-stretch"
        style={{ borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {primary.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              style={{ color: active ? '#f97316' : 'var(--text-3)' }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-orange-500" />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative"
          style={{ color: moreActive ? '#f97316' : 'var(--text-3)' }}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium leading-none">More</span>
          {moreActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-orange-500" />
          )}
        </button>
      </nav>

      {/* More sheet */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${sheetOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${sheetOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSheetOpen(false)}
        />
        {/* Sheet panel */}
        <div className={`absolute bottom-0 left-0 right-0 glass-dark rounded-t-2xl border-t transition-transform duration-300 ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
          </div>

          {/* Sheet header */}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-semibold t-1">More</span>
            <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 t-2">
              <X size={16} />
            </button>
          </div>

          {/* Nav items */}
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            {more.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    active ? 'nav-active' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{ color: active ? '#f97316' : 'var(--text-2)' }}
                >
                  <Icon size={20} style={{ color: active ? '#f97316' : 'var(--text-3)' }} />
                  <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme toggle + donate */}
          <div className="px-4 pb-4 space-y-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
              style={{ border: '1px solid var(--border)' }}
            >
              <span className="text-sm t-2">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              <div className="relative w-10 h-6 rounded-full transition-colors duration-300"
                style={{ background: isDark ? '#f97316' : '#d1d5db' }}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-5' : 'translate-x-1'}`}>
                  {isDark ? <Moon size={9} className="text-orange-500" /> : <Sun size={9} className="text-yellow-500" />}
                </div>
              </div>
            </button>
            {/* Support card */}
            <div className="rounded-xl p-3.5 space-y-2.5" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
              <div>
                <div className="text-sm font-semibold t-1">Support the Project</div>
                <p className="text-xs t-3 mt-0.5 leading-snug">If this tool helped you manage your crypto journey, consider supporting its development.</p>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80"
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
                <Coffee size={14} />
                Buy Me a Coffee
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

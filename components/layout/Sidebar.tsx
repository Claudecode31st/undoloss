'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Settings, Sun, Moon, Undo2 } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = theme === 'dark';

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-48 glass-dark flex-col z-40 border-r"
      style={{ borderColor: 'var(--border)' }}>

      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Undo2 size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight t-1">Undo Loss</div>
            <div className="text-[10px] leading-tight t-3">Recovery System</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                active ? 'nav-active font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: active ? '#f97316' : 'var(--text-2)' }}
            >
              <Icon size={15} style={{ color: active ? '#f97316' : 'var(--text-3)' }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {mounted && (
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5"
            style={{ border: '1px solid var(--border)' }}
          >
            <span className="text-xs t-2">{isDark ? 'Dark' : 'Light'} Mode</span>
            <div className="relative w-9 h-5 rounded-full transition-colors duration-300"
              style={{ background: isDark ? '#f97316' : '#d1d5db' }}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`}>
                {isDark ? <Moon size={9} className="text-orange-500" /> : <Sun size={9} className="text-yellow-500" />}
              </div>
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}

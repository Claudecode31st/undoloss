'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { LayoutDashboard, Settings, Sun, Moon } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const isDark = theme === 'dark';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-dark border-t flex items-stretch"
      style={{ borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors"
            style={{ color: active ? '#f97316' : 'var(--text-3)' }}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
            {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-orange-500" />}
          </Link>
        );
      })}

      {/* Theme toggle */}
      <button
        onClick={() => { setThemeMounted(true); setTheme(isDark ? 'light' : 'dark'); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
        style={{ color: 'var(--text-3)' }}
      >
        {isDark
          ? <><Moon size={20} /><span className="text-[10px] font-medium">Dark</span></>
          : <><Sun size={20} /><span className="text-[10px] font-medium">Light</span></>
        }
        {themeMounted && null /* just to suppress unused var warning */}
      </button>
    </nav>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-1)' }}>
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b glass-dark"
        style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 t-2"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.svg" alt="Undo Loss" width={26} height={26} className="rounded-md" priority />
          <span className="text-sm font-bold t-1">Undo Loss</span>
        </Link>
      </header>

      <main className="md:ml-48 min-h-screen">
        <div className="p-4 md:p-5">{children}</div>
      </main>
    </div>
  );
}

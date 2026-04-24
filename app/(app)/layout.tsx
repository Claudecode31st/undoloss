'use client';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-page)', color: 'var(--text-1)' }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top logo bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center px-4 py-2.5 border-b glass-dark"
        style={{ borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.svg" alt="Undo Loss" width={26} height={26} className="rounded-md flex-shrink-0" priority />
          <span className="text-sm font-bold t-1">Undo Loss</span>
        </Link>
      </header>

      <main className="md:ml-48 min-h-screen">
        <div className="p-4 md:p-5 pb-24 md:pb-5">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

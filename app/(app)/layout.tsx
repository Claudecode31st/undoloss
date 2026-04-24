'use client';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-1)' }}>
      {/* Desktop sidebar */}
      <Sidebar />

      <main className="md:ml-48 min-h-screen">
        <div className="p-4 md:p-5 pb-24 md:pb-5">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

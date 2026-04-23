import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-1)' }}>
      <Sidebar />
      <main className="ml-48 min-h-screen">
        <div className="p-5">{children}</div>
      </main>
    </div>
  );
}

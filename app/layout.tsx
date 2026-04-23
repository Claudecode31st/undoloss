import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import ThemeProvider from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Undo Loss',
  description: 'Manage and recover crypto losses through structured, rule-based decision support focused on capital preservation, risk control, and disciplined execution.',
  keywords: ['crypto', 'portfolio', 'recovery', 'risk management', 'DCA', 'hedging'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased" style={{ background: 'var(--bg-page)', color: 'var(--text-1)' }}>
        <ThemeProvider>
          <Sidebar />
          <main className="ml-48 min-h-screen">
            <div className="p-5">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Undo Loss — Crypto Recovery System',
  description: 'A structured, discipline-first recovery system for crypto portfolios. Track PnL, plan DCA, hedge risk, and simulate scenarios — all in your browser.',
  keywords: ['crypto', 'portfolio', 'recovery', 'risk management', 'DCA', 'hedging', 'bitcoin', 'ethereum'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

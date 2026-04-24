'use client';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import RecoveryPanel from '@/components/dashboard/RecoveryPanel';
import { usePortfolioRefresh } from '@/lib/usePortfolioRefresh';

export default function RecoveryCalculatorPage() {
  const { portfolio, refreshing, lastUpdated, refresh } = usePortfolioRefresh();

  if (!portfolio) return <div className="t-3 p-8">Loading…</div>;

  if (portfolio.assets.length === 0) {
    return (
      <>
        <Header title="Recovery Panel" subtitle="Model your path back to breakeven" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
        <GlassCard className="p-8 text-center">
          <p className="t-3 text-sm">Add assets to your portfolio first.</p>
        </GlassCard>
      </>
    );
  }

  return (
    <>
      <Header title="Recovery Panel" subtitle="Model your path back to breakeven" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
      <RecoveryPanel assets={portfolio.assets} />
    </>
  );
}

'use client';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import AverageDownDetail from '@/components/dashboard/AverageDownDetail';
import { usePortfolioRefresh } from '@/lib/usePortfolioRefresh';

export default function AverageDownPage() {
  const { portfolio, refreshing, lastUpdated, refresh } = usePortfolioRefresh();

  if (!portfolio) return <div className="t-3 p-8">Loading…</div>;

  if (portfolio.assets.length === 0) {
    return (
      <>
        <Header title="Average Down" subtitle="Plan your buy schedule to lower your average entry" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
        <GlassCard className="p-8 text-center"><p className="t-3 text-sm">Add assets to your portfolio first.</p></GlassCard>
      </>
    );
  }

  return (
    <>
      <Header title="Average Down" subtitle="Plan your buy schedule to lower your average entry" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
      <AverageDownDetail assets={portfolio.assets} />
    </>
  );
}

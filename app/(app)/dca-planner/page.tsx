'use client';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import DCAPanel from '@/components/dashboard/DCAPanel';
import { usePortfolioRefresh } from '@/lib/usePortfolioRefresh';

export default function DCAPlanner() {
  const { portfolio, refreshing, lastUpdated, refresh } = usePortfolioRefresh();

  if (!portfolio) return <div className="t-3 p-8">Loading…</div>;

  if (portfolio.assets.length === 0) {
    return (
      <>
        <Header title="DCA Planner" subtitle="Build your buy schedule" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
        <GlassCard className="p-8 text-center"><p className="t-3 text-sm">Add assets to your portfolio first.</p></GlassCard>
      </>
    );
  }

  return (
    <>
      <Header title="DCA Planner" subtitle="Your month-by-month buy schedule" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
      <DCAPanel assets={portfolio.assets} />
    </>
  );
}

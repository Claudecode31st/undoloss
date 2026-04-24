'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, BarChart2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import StatsCards from '@/components/dashboard/StatsCards';
import PortfolioTable from '@/components/dashboard/PortfolioTable';
import PortfolioAllocation from '@/components/dashboard/PortfolioAllocation';
import RecoveryPanel from '@/components/dashboard/RecoveryPanel';
import DCAPanel from '@/components/dashboard/DCAPanel';
import AssetModal from '@/components/modals/AssetModal';
import { CryptoAsset, Portfolio, Prefs } from '@/lib/types';
import { loadPortfolio, savePortfolio, loadPrefs } from '@/lib/storage';
import { calcPortfolioStats, calcRiskScore, fmtCurrency } from '@/lib/calculations';
import { fetchPrices } from '@/lib/coingecko';

/* ── Mobile collapsible section ──────────────────────────────── */
function MobileSection({
  title, preview, icon: Icon, iconColor, iconBg, open, onToggle, children,
}: {
  title: string; preview: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  if (open) {
    return (
      <div>
        {children}
        <button
          onClick={onToggle}
          className="mt-2 w-full py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium t-3 transition-colors hover:t-1"
          style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}
        >
          <ChevronDown size={13} style={{ transform: 'rotate(180deg)' }} />
          Collapse
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold t-1 leading-tight">{title}</div>
        <div className="text-xs t-3 truncate mt-0.5">{preview}</div>
      </div>
      <ChevronDown size={15} className="t-3 flex-shrink-0" />
    </button>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ show24hChange: true, showScenarioOutlook: true, showConcentrationRisk: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<CryptoAsset | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  useEffect(() => {
    const p = loadPortfolio();
    setPortfolio(p);
    setLastUpdated(p.lastUpdated);
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => { if (portfolio) savePortfolio(portfolio); }, [portfolio]);

  const refreshPrices = useCallback(async () => {
    if (!portfolio) return;
    setRefreshing(true);
    try {
      const ids = portfolio.assets.map((a) => a.coinGeckoId);
      const prices = await fetchPrices(ids);
      setPortfolio((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assets: prev.assets.map((a) => ({
            ...a,
            currentPrice: prices[a.coinGeckoId]?.usd ?? a.currentPrice,
            change24h: prices[a.coinGeckoId]?.usd_24h_change ?? a.change24h,
          })),
        };
      });
      setLastUpdated(new Date().toISOString());
    } catch { /* keep existing */ }
    finally { setRefreshing(false); }
  }, [portfolio]);

  useEffect(() => {
    const interval = setInterval(refreshPrices, 60_000);
    return () => clearInterval(interval);
  }, [refreshPrices]);

  if (!portfolio) {
    return <div className="flex items-center justify-center min-h-screen"><div className="t-3 text-sm">Loading...</div></div>;
  }

  const stats = calcPortfolioStats(portfolio.assets);
  const risk  = calcRiskScore(portfolio.assets);

  const handleAddAsset    = () => { setEditAsset(null); setModalOpen(true); };
  const handleEditAsset   = (a: CryptoAsset) => { setEditAsset(a); setModalOpen(true); };
  const handleDeleteAsset = (id: string) => setPortfolio((p) => p ? { ...p, assets: p.assets.filter((a) => a.id !== id) } : p);
  const handleSaveAsset   = (asset: CryptoAsset) => setPortfolio((p) => {
    if (!p) return p;
    const exists = p.assets.find((a) => a.id === asset.id);
    return { ...p, assets: exists ? p.assets.map((a) => a.id === asset.id ? asset : a) : [...p.assets, asset] };
  });

  /* Recovery alert banner */
  const deepLoss = stats.totalInvested > 0 && stats.totalUnrealizedPnL < 0 &&
    Math.abs(stats.totalUnrealizedPnL / stats.totalInvested) >= 0.3;

  const portfolioTable = (
    <PortfolioTable assets={portfolio.assets} onAdd={handleAddAsset} onEdit={handleEditAsset} onDelete={handleDeleteAsset} />
  );

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Portfolio overview"
        lastUpdated={lastUpdated}
        onRefresh={refreshPrices}
        refreshing={refreshing}
      />

      {/* Recovery alert */}
      {deepLoss && (
        <div className="mb-3 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <span className="text-red-500 text-base flex-shrink-0">⚠</span>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-red-500">Portfolio in deep drawdown</span>
            <span className="text-xs t-3 ml-2">
              Down {Math.abs((stats.totalUnrealizedPnL / stats.totalInvested) * 100).toFixed(0)}% · Use Recovery Calc and DCA Planner to plan your path back
            </span>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <StatsCards stats={stats} risk={risk} assets={portfolio.assets} assetCount={portfolio.assets.length} show24hChange={prefs.show24hChange} />

      {/* ── MOBILE layout ── */}
      <div className="md:hidden mt-3">
        <MobileSection
          title="Portfolio"
          preview={`${fmtCurrency(stats.totalValue)} · ${portfolio.assets.length} assets`}
          icon={BarChart2} iconColor="text-blue-500" iconBg="bg-blue-500/10"
          open={portfolioOpen} onToggle={() => setPortfolioOpen((v) => !v)}
        >
          <div className="space-y-3">
            {portfolioTable}
            <PortfolioAllocation assets={portfolio.assets} />
            <RecoveryPanel assets={portfolio.assets} />
            <DCAPanel assets={portfolio.assets} />
          </div>
        </MobileSection>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-4" style={{ alignItems: 'stretch' }}>
          <div className="col-span-2 flex flex-col">{portfolioTable}</div>
          <div className="col-span-1 flex flex-col min-h-0">
            <PortfolioAllocation assets={portfolio.assets} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 items-start">
          <RecoveryPanel assets={portfolio.assets} />
          <DCAPanel assets={portfolio.assets} />
        </div>
      </div>

      <AssetModal
        open={modalOpen}
        asset={editAsset}
        onClose={() => { setModalOpen(false); setEditAsset(null); }}
        onSave={handleSaveAsset}
      />
    </>
  );
}

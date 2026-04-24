'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/layout/Header';
import StatsCards from '@/components/dashboard/StatsCards';
import PortfolioTable from '@/components/dashboard/PortfolioTable';
import PortfolioAllocation from '@/components/dashboard/PortfolioAllocation';
import ConcentrationRisk from '@/components/dashboard/ConcentrationRisk';
import StrategyMode from '@/components/dashboard/StrategyMode';
import RecoveryPlanCard from '@/components/dashboard/RecoveryPlanCard';
import ScenarioOutlook from '@/components/dashboard/ScenarioOutlook';
import BehavioralGuard from '@/components/dashboard/BehavioralGuard';
import AssetModal from '@/components/modals/AssetModal';
import { CryptoAsset, Portfolio, StrategyMode as TStrategyMode, RiskMode } from '@/lib/types';
import { loadPortfolio, savePortfolio } from '@/lib/storage';
import { calcPortfolioStats, calcAllocation, calcRiskScore, fmtCurrency } from '@/lib/calculations';
import { generateStrategyResult } from '@/lib/strategies';
import { generateScenarios } from '@/lib/scenarios';
import { analyzeBehavior } from '@/lib/behavioral';
import { fetchPrices } from '@/lib/coingecko';

/* ── Mobile collapsible section ──────────────────────────────── */
function MobileSection({
  title, preview, open, onToggle, children,
}: {
  title: string; preview: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl glass text-left"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-sm font-semibold t-1">{title}</span>
          {!open && <span className="text-xs t-3 truncate">— {preview}</span>}
        </div>
        <ChevronDown
          size={15}
          className="t-3 flex-shrink-0 ml-2 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<CryptoAsset | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const KEYS = ['portfolio', 'strategy', 'recovery', 'scenario', 'behavioral'] as const;
  type Key = typeof KEYS[number];
  const [open, setOpen] = useState<Record<Key, boolean>>({
    portfolio: false, strategy: false, recovery: false, scenario: false, behavioral: false,
  });

  const allOpen = KEYS.every((k) => open[k]);
  const toggle = (k: Key) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  const setAll = (val: boolean) => setOpen(Object.fromEntries(KEYS.map((k) => [k, val])) as Record<Key, boolean>);

  useEffect(() => {
    const p = loadPortfolio();
    setPortfolio(p);
    setLastUpdated(p.lastUpdated);
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

  const stats         = calcPortfolioStats(portfolio.assets);
  const allocation    = calcAllocation(portfolio.assets);
  const risk          = calcRiskScore(portfolio.assets);
  const strategyResult = generateStrategyResult(portfolio.assets, portfolio.strategy, portfolio.riskMode, portfolio.hedgeRatio);
  const scenarios     = generateScenarios(portfolio.assets);
  const warnings      = analyzeBehavior(portfolio.assets);

  const handleAddAsset    = () => { setEditAsset(null); setModalOpen(true); };
  const handleEditAsset   = (a: CryptoAsset) => { setEditAsset(a); setModalOpen(true); };
  const handleDeleteAsset = (id: string) => setPortfolio((p) => p ? { ...p, assets: p.assets.filter((a) => a.id !== id) } : p);
  const handleSaveAsset   = (asset: CryptoAsset) => setPortfolio((p) => {
    if (!p) return p;
    const exists = p.assets.find((a) => a.id === asset.id);
    return { ...p, assets: exists ? p.assets.map((a) => a.id === asset.id ? asset : a) : [...p.assets, asset] };
  });

  const previews: Record<Key, string> = {
    portfolio:  `${fmtCurrency(stats.totalValue)} · ${portfolio.assets.length} assets`,
    strategy:   `${strategyResult.name} · ${portfolio.riskMode}`,
    recovery:   `${strategyResult.hedgeStatus}`,
    scenario:   'Bull / Sideways / Bear',
    behavioral: `${warnings.length} risk signals`,
  };

  // Shared components
  const portfolioTable = (
    <PortfolioTable assets={portfolio.assets} onAdd={handleAddAsset} onEdit={handleEditAsset} onDelete={handleDeleteAsset} />
  );
  const strategyMode = (
    <StrategyMode
      strategy={portfolio.strategy}
      riskMode={portfolio.riskMode}
      onStrategyChange={(s: TStrategyMode) => setPortfolio((p) => p ? { ...p, strategy: s } : p)}
      onRiskModeChange={(r: RiskMode) => setPortfolio((p) => p ? { ...p, riskMode: r } : p)}
    />
  );
  const recoveryPlan = (
    <RecoveryPlanCard
      result={strategyResult}
      hedgeRatio={portfolio.hedgeRatio}
      onHedgeChange={(ratio) => setPortfolio((p) => p ? { ...p, hedgeRatio: ratio } : p)}
    />
  );
  const scenarioOutlook = <ScenarioOutlook scenarios={scenarios} />;
  const behavioralGuard = <BehavioralGuard warnings={warnings} />;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Overview of your portfolio and recovery system"
        lastUpdated={lastUpdated}
        onRefresh={refreshPrices}
        refreshing={refreshing}
      />

      {/* Stats — always visible on all screen sizes */}
      <StatsCards stats={stats} risk={risk} />

      {/* ── MOBILE layout ── */}
      <div className="md:hidden space-y-2 mt-3">
        {/* Expand / Collapse All */}
        <div className="flex justify-end mb-1">
          <button
            onClick={() => setAll(!allOpen)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-orange-500 hover:text-orange-400"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}
          >
            {allOpen ? '↑ Collapse All' : '↓ Expand All'}
          </button>
        </div>

        <MobileSection title="Portfolio" preview={previews.portfolio} open={open.portfolio} onToggle={() => toggle('portfolio')}>
          <div className="space-y-3">
            {portfolioTable}
            <PortfolioAllocation allocation={allocation} />
            <ConcentrationRisk risk={risk} />
          </div>
        </MobileSection>

        <MobileSection title="Strategy Mode" preview={previews.strategy} open={open.strategy} onToggle={() => toggle('strategy')}>
          {strategyMode}
        </MobileSection>

        <MobileSection title="Recovery Plan" preview={previews.recovery} open={open.recovery} onToggle={() => toggle('recovery')}>
          {recoveryPlan}
        </MobileSection>

        <MobileSection title="Scenario Outlook" preview={previews.scenario} open={open.scenario} onToggle={() => toggle('scenario')}>
          {scenarioOutlook}
        </MobileSection>

        <MobileSection title="Behavioral Guard" preview={previews.behavioral} open={open.behavioral} onToggle={() => toggle('behavioral')}>
          {behavioralGuard}
        </MobileSection>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block">
        {/* Row 1: portfolio table + allocation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4">
          <div className="md:col-span-2">{portfolioTable}</div>
          <div className="md:col-span-1 flex flex-col gap-3">
            <PortfolioAllocation allocation={allocation} />
            <ConcentrationRisk risk={risk} />
          </div>
        </div>

        {/* Row 2: strategy + recovery + scenario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>{strategyMode}</div>
          <div>{recoveryPlan}</div>
          <div>{scenarioOutlook}</div>
        </div>

        {/* Row 3: behavioral guard */}
        {behavioralGuard}
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

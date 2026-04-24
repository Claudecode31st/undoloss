'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, BarChart2, Sliders, ShieldCheck, TrendingUp, Brain } from 'lucide-react';
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

        <MobileSection title="Portfolio" preview={previews.portfolio} icon={BarChart2} iconColor="text-blue-500" iconBg="bg-blue-500/10" open={open.portfolio} onToggle={() => toggle('portfolio')}>
          <div className="space-y-3">
            {portfolioTable}
            <PortfolioAllocation allocation={allocation} />
            <ConcentrationRisk risk={risk} />
          </div>
        </MobileSection>

        <MobileSection title="Strategy Mode" preview={previews.strategy} icon={Sliders} iconColor="text-orange-500" iconBg="bg-orange-500/10" open={open.strategy} onToggle={() => toggle('strategy')}>
          {strategyMode}
        </MobileSection>

        <MobileSection title="Recovery Plan" preview={previews.recovery} icon={ShieldCheck} iconColor="text-emerald-500" iconBg="bg-emerald-500/10" open={open.recovery} onToggle={() => toggle('recovery')}>
          {recoveryPlan}
        </MobileSection>

        <MobileSection title="Scenario Outlook" preview={previews.scenario} icon={TrendingUp} iconColor="text-purple-500" iconBg="bg-purple-500/10" open={open.scenario} onToggle={() => toggle('scenario')}>
          {scenarioOutlook}
        </MobileSection>

        <MobileSection title="Behavioral Guard" preview={previews.behavioral} icon={Brain} iconColor="text-amber-500" iconBg="bg-amber-500/10" open={open.behavioral} onToggle={() => toggle('behavioral')}>
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

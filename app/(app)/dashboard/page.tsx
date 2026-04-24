'use client';
import { useState, useEffect, useCallback } from 'react';
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
import { CryptoAsset, Portfolio } from '@/lib/types';
import { loadPortfolio, savePortfolio } from '@/lib/storage';
import { calcPortfolioStats, calcAllocation, calcRiskScore } from '@/lib/calculations';
import { generateStrategyResult } from '@/lib/strategies';
import { generateScenarios } from '@/lib/scenarios';
import { analyzeBehavior } from '@/lib/behavioral';
import { fetchPrices } from '@/lib/coingecko';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<CryptoAsset | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // Load from storage on mount
  useEffect(() => {
    const p = loadPortfolio();
    setPortfolio(p);
    setLastUpdated(p.lastUpdated);
  }, []);

  // Persist on change
  useEffect(() => {
    if (portfolio) {
      savePortfolio(portfolio);
    }
  }, [portfolio]);

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
    } catch {
      // silently fail — keep existing prices
    } finally {
      setRefreshing(false);
    }
  }, [portfolio]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(refreshPrices, 60_000);
    return () => clearInterval(interval);
  }, [refreshPrices]);

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  const stats = calcPortfolioStats(portfolio.assets);
  const allocation = calcAllocation(portfolio.assets);
  const risk = calcRiskScore(portfolio.assets);
  const strategyResult = generateStrategyResult(portfolio.assets, portfolio.strategy, portfolio.riskMode, portfolio.hedgeRatio);
  const scenarios = generateScenarios(portfolio.assets);
  const warnings = analyzeBehavior(portfolio.assets);

  const handleAddAsset = () => {
    setEditAsset(null);
    setModalOpen(true);
  };

  const handleEditAsset = (asset: CryptoAsset) => {
    setEditAsset(asset);
    setModalOpen(true);
  };

  const handleDeleteAsset = (id: string) => {
    setPortfolio((prev) => prev ? { ...prev, assets: prev.assets.filter((a) => a.id !== id) } : prev);
  };

  const handleSaveAsset = (asset: CryptoAsset) => {
    setPortfolio((prev) => {
      if (!prev) return prev;
      const existing = prev.assets.find((a) => a.id === asset.id);
      return {
        ...prev,
        assets: existing
          ? prev.assets.map((a) => (a.id === asset.id ? asset : a))
          : [...prev.assets, asset],
      };
    });
  };

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Overview of your portfolio and recovery system"
        lastUpdated={lastUpdated}
        onRefresh={refreshPrices}
        refreshing={refreshing}
      />

      {/* Stats row */}
      <StatsCards stats={stats} risk={risk} />

      {/* Middle row: portfolio table + allocation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <PortfolioTable
            assets={portfolio.assets}
            onAdd={handleAddAsset}
            onEdit={handleEditAsset}
            onDelete={handleDeleteAsset}
          />
        </div>
        <div className="md:col-span-1 flex flex-col gap-3">
          <PortfolioAllocation allocation={allocation} />
          <ConcentrationRisk risk={risk} />
        </div>
      </div>

      {/* Bottom row: strategy + recovery plan + scenario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <StrategyMode
            strategy={portfolio.strategy}
            riskMode={portfolio.riskMode}
            onStrategyChange={(s) => setPortfolio((p) => p ? { ...p, strategy: s } : p)}
            onRiskModeChange={(r) => setPortfolio((p) => p ? { ...p, riskMode: r } : p)}
          />
        </div>
        <div>
          <RecoveryPlanCard
            result={strategyResult}
            hedgeRatio={portfolio.hedgeRatio}
            onHedgeChange={(ratio) => setPortfolio((p) => p ? { ...p, hedgeRatio: ratio } : p)}
          />
        </div>
        <div>
          <ScenarioOutlook scenarios={scenarios} />
        </div>
      </div>

      {/* Behavioral guard bar */}
      <BehavioralGuard warnings={warnings} />

      <AssetModal
        open={modalOpen}
        asset={editAsset}
        onClose={() => { setModalOpen(false); setEditAsset(null); }}
        onSave={handleSaveAsset}
      />
    </>
  );
}

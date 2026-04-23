'use client';
import { useState, useEffect } from 'react';
import { Download, Upload } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import PortfolioTable from '@/components/dashboard/PortfolioTable';
import AssetModal from '@/components/modals/AssetModal';
import { CryptoAsset, Portfolio } from '@/lib/types';
import { loadPortfolio, savePortfolio, exportPortfolio, importPortfolio } from '@/lib/storage';
import { calcPortfolioStats, fmtCurrency, fmtPercent } from '@/lib/calculations';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<CryptoAsset | null>(null);

  useEffect(() => {
    setPortfolio(loadPortfolio());
  }, []);

  useEffect(() => {
    if (portfolio) savePortfolio(portfolio);
  }, [portfolio]);

  if (!portfolio) return <div className="text-zinc-500 text-sm p-8">Loading...</div>;

  const stats = calcPortfolioStats(portfolio.assets);

  return (
    <>
      <Header title="Portfolio" subtitle="Manage your crypto positions" lastUpdated={portfolio.lastUpdated} />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Value', value: fmtCurrency(stats.totalValue), sub: 'Current market value' },
          { label: 'Total Invested', value: fmtCurrency(stats.totalInvested), sub: 'Cost basis' },
          { label: 'Unrealized P/L', value: fmtCurrency(stats.totalUnrealizedPnL), sub: fmtPercent(stats.totalUnrealizedPnLPercent), pos: stats.totalUnrealizedPnL >= 0 },
          { label: 'Assets', value: String(portfolio.assets.length), sub: 'Positions tracked' },
        ].map((item) => (
          <GlassCard key={item.label} className="p-4">
            <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
            <div className={`text-xl font-bold ${item.pos === false ? 'text-red-400' : item.pos === true ? 'text-emerald-400' : 'text-white'}`}>
              {item.value}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>
          </GlassCard>
        ))}
      </div>

      <PortfolioTable
        assets={portfolio.assets}
        onAdd={() => { setEditAsset(null); setModalOpen(true); }}
        onEdit={(a) => { setEditAsset(a); setModalOpen(true); }}
        onDelete={(id) => setPortfolio((p) => p ? { ...p, assets: p.assets.filter((a) => a.id !== id) } : p)}
      />

      {/* Export / Import */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => exportPortfolio(portfolio)}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <Download size={14} /> Export JSON
        </button>
        <label className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-zinc-300 hover:text-white cursor-pointer transition-colors">
          <Upload size={14} /> Import JSON
          <input type="file" accept=".json" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const imported = await importPortfolio(file);
              setPortfolio(imported);
            } catch {
              alert('Invalid portfolio file');
            }
          }} />
        </label>
      </div>

      <AssetModal
        open={modalOpen}
        asset={editAsset}
        onClose={() => { setModalOpen(false); setEditAsset(null); }}
        onSave={(asset) => setPortfolio((p) => {
          if (!p) return p;
          const existing = p.assets.find((a) => a.id === asset.id);
          return { ...p, assets: existing ? p.assets.map((a) => a.id === asset.id ? asset : a) : [...p.assets, asset] };
        })}
      />
    </>
  );
}

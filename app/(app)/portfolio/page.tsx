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

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);
  useEffect(() => { if (portfolio) savePortfolio(portfolio); }, [portfolio]);

  if (!portfolio) return <div className="t-3 text-sm p-8">Loading...</div>;

  const stats = calcPortfolioStats(portfolio.assets);

  return (
    <>
      <Header title="Portfolio" subtitle="Manage your crypto positions" lastUpdated={portfolio.lastUpdated} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Value', value: fmtCurrency(stats.totalValue), sub: 'Current market value', cls: 't-1' },
          { label: 'Total Invested', value: fmtCurrency(stats.totalInvested), sub: 'Cost basis', cls: 't-1' },
          { label: 'Unrealized P/L', value: fmtCurrency(stats.totalUnrealizedPnL), sub: fmtPercent(stats.totalUnrealizedPnLPercent), cls: stats.totalUnrealizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500' },
          { label: 'Assets', value: String(portfolio.assets.length), sub: 'Positions tracked', cls: 't-1' },
        ].map((item) => (
          <GlassCard key={item.label} className="p-3 md:p-4">
            <div className="text-[11px] t-3 mb-1">{item.label}</div>
            <div className={`text-base md:text-xl font-bold truncate ${item.cls}`}>{item.value}</div>
            <div className="text-[11px] t-3 mt-0.5 leading-tight">{item.sub}</div>
          </GlassCard>
        ))}
      </div>

      <PortfolioTable
        assets={portfolio.assets}
        onAdd={() => { setEditAsset(null); setModalOpen(true); }}
        onEdit={(a) => { setEditAsset(a); setModalOpen(true); }}
        onDelete={(id) => setPortfolio((p) => p ? { ...p, assets: p.assets.filter((a) => a.id !== id) } : p)}
      />

      <div className="flex gap-3 mt-4">
        <button onClick={() => exportPortfolio(portfolio)}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm t-2 hover:t-1 transition-colors">
          <Download size={14} /> Export JSON
        </button>
        <label className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm t-2 hover:t-1 cursor-pointer transition-colors">
          <Upload size={14} /> Import JSON
          <input type="file" accept=".json" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try { setPortfolio(await importPortfolio(file)); }
            catch { alert('Invalid portfolio file'); }
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

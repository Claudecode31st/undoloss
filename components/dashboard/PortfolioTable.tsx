'use client';
import { Pencil, Trash2, Plus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcAssetPnL, fmtCurrency, fmtPercent, fmtNumber } from '@/lib/calculations';

interface PortfolioTableProps {
  assets: CryptoAsset[];
  onAdd: () => void;
  onEdit: (asset: CryptoAsset) => void;
  onDelete: (id: string) => void;
}

export default function PortfolioTable({ assets, onAdd, onEdit, onDelete }: PortfolioTableProps) {
  const totalPnL = assets.reduce((sum, a) => sum + calcAssetPnL(a).unrealizedPnL, 0);
  const totalInvested = assets.reduce((sum, a) => sum + a.entryPrice * a.amount, 0);
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Your Portfolio
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-500 text-xs font-medium hover:bg-orange-500/25 transition-colors"
        >
          <Plus size={12} />
          Add Asset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Asset', 'Amount', 'Entry Price', 'Current Price', 'Unrealized P/L', 'P/L %', 'Actions'].map((h) => (
                <th key={h} className="text-left text-[11px] t-3 font-medium px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const pnl = calcAssetPnL(asset);
              const pos = pnl.unrealizedPnL >= 0;
              return (
                <tr key={asset.id} className="table-row-hover transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                        {asset.symbol.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold t-1">{asset.symbol}</div>
                        <div className="text-[11px] t-3">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm t-1">{fmtNumber(asset.amount, asset.amount < 1 ? 4 : 2)} {asset.symbol}</div>
                    <div className="text-[11px] t-3">{fmtCurrency(pnl.costBasis)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm t-1">{fmtCurrency(asset.entryPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm t-1">{fmtCurrency(asset.currentPrice)}</div>
                    {asset.change24h !== undefined && (
                      <div className={`text-[11px] font-medium ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {fmtPercent(asset.change24h)}
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fmtCurrency(pnl.unrealizedPnL)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fmtPercent(pnl.unrealizedPnLPercent)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onEdit(asset)}
                        className="p-1.5 rounded-lg t-3 hover:text-orange-500 transition-colors" style={{ background: 'var(--surface-deep)' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => onDelete(asset.id)}
                        className="p-1.5 rounded-lg t-3 hover:text-red-500 transition-colors" style={{ background: 'var(--surface-deep)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {assets.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border-strong)' }}>
                <td colSpan={4} className="px-4 py-3 text-xs t-3 font-medium">Total / Average</td>
                <td className={`px-4 py-3 text-sm font-bold ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtCurrency(totalPnL)}</td>
                <td className={`px-4 py-3 text-sm font-bold ${totalPnLPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtPercent(totalPnLPct)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
        {assets.length === 0 && (
          <div className="text-center py-12 t-3 text-sm">No assets yet. Click &quot;Add Asset&quot; to get started.</div>
        )}
      </div>
    </GlassCard>
  );
}

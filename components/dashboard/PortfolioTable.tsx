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
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Your Portfolio
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-medium hover:bg-orange-500/25 transition-colors"
        >
          <Plus size={12} />
          Add Asset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              {['Asset', 'Amount', 'Entry Price', 'Current Price', 'Unrealized P/L', 'P/L %', 'Actions'].map((h) => (
                <th key={h} className="text-left text-[11px] text-zinc-500 font-medium px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const pnl = calcAssetPnL(asset);
              const pos = pnl.unrealizedPnL >= 0;
              return (
                <tr key={asset.id} className="table-row-hover border-b border-zinc-800/30 transition-colors">
                  {/* Asset */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}
                      >
                        {asset.symbol.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{asset.symbol}</div>
                        <div className="text-[11px] text-zinc-500">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  {/* Amount */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">{fmtNumber(asset.amount, asset.amount < 1 ? 4 : 2)} {asset.symbol}</div>
                    <div className="text-[11px] text-zinc-500">{fmtCurrency(pnl.costBasis)}</div>
                  </td>
                  {/* Entry Price */}
                  <td className="px-4 py-3 text-sm text-white">{fmtCurrency(asset.entryPrice)}</td>
                  {/* Current Price */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">{fmtCurrency(asset.currentPrice)}</div>
                    {asset.change24h !== undefined && (
                      <div className={`text-[11px] font-medium ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmtPercent(asset.change24h)}
                      </div>
                    )}
                  </td>
                  {/* PnL */}
                  <td className={`px-4 py-3 text-sm font-medium ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtCurrency(pnl.unrealizedPnL)}
                  </td>
                  {/* PnL % */}
                  <td className={`px-4 py-3 text-sm font-medium ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtPercent(pnl.unrealizedPnLPercent)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEdit(asset)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(asset.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
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
              <tr className="border-t border-zinc-700/50">
                <td colSpan={4} className="px-4 py-3 text-xs text-zinc-500 font-medium">Total / Average</td>
                <td className={`px-4 py-3 text-sm font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtCurrency(totalPnL)}
                </td>
                <td className={`px-4 py-3 text-sm font-bold ${totalPnLPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtPercent(totalPnLPct)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
        {assets.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No assets yet. Click &quot;Add Asset&quot; to get started.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

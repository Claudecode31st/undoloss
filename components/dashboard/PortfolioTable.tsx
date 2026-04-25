'use client';
import { Pencil, Trash2, Plus, Wallet, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { calcAssetPnL, calcMarginCallPrice, fmtCurrency, fmtPercent, fmtNumber } from '@/lib/calculations';

interface PortfolioTableProps {
  assets: CryptoAsset[];
  onAdd: () => void;
  onEdit: (asset: CryptoAsset) => void;
  onDelete: (id: string) => void;
}

const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

export default function PortfolioTable({ assets, onAdd, onEdit, onDelete }: PortfolioTableProps) {
  const totalPnL = assets.reduce((sum, a) => sum + calcAssetPnL(a).unrealizedPnL, 0);
  const totalInvested = assets.reduce((sum, a) => sum + a.entryPrice * a.amount, 0);
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <GlassCard className="overflow-hidden h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold t-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Your Portfolio
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-500 text-xs font-medium hover:bg-orange-500/25 transition-colors"
        >
          <Plus size={12} /> Add Asset
        </button>
      </div>

      {/* ── Mobile list ── */}
      <div className="md:hidden">
        {assets.length === 0 && (
          <div className="text-center py-10 t-3 text-sm">No assets yet. Tap "Add Asset" to get started.</div>
        )}
        {assets.map((asset) => {
          const pnl = calcAssetPnL(asset);
          const pos = pnl.unrealizedPnL >= 0;
          const isLong = (asset.direction ?? 'long') === 'long';
          return (
            <div key={asset.id} className="flex items-center gap-3 px-4 py-3 table-row-hover transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                {asset.symbol.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold t-1">{asset.symbol}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isLong ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>
                    {isLong ? 'L' : 'S'}{asset.leverage && asset.leverage > 1 ? ` ${asset.leverage}×` : ''}
                  </span>
                  {asset.change24h !== undefined && (
                    <span className={`text-[10px] ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {fmtPercent(asset.change24h)}
                    </span>
                  )}
                </div>
                <div className="text-[11px] t-3 mt-0.5">{fmtCurrency(asset.currentPrice)}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-semibold ${pos ? 'text-emerald-500' : 'text-red-500'}`}>{fmtCurrency(pnl.unrealizedPnL)}</div>
                <div className={`text-[11px] ${pos ? 'text-emerald-500' : 'text-red-500'}`}>{fmtPercent(pnl.unrealizedPnLPercent)}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => onEdit(asset)} className="p-1.5 rounded-lg t-3 hover:text-orange-500 transition-colors" style={{ background: 'var(--surface-deep)' }}><Pencil size={13} /></button>
                <button onClick={() => onDelete(asset.id)} className="p-1.5 rounded-lg t-3 hover:text-red-500 transition-colors" style={{ background: 'var(--surface-deep)' }}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
        {assets.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs t-3">Total P/L</span>
            <span className={`text-sm font-bold ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {fmtCurrency(totalPnL)} <span className="text-xs ml-1">{fmtPercent(totalPnLPct)}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Desktop table — 5 columns ── */}
      <div className="hidden md:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '30%' }} /> {/* Asset + direction */}
            <col style={{ width: '16%' }} /> {/* Size */}
            <col style={{ width: '24%' }} /> {/* Entry / Current */}
            <col style={{ width: '22%' }} /> {/* P/L */}
            <col style={{ width: '8%' }}  /> {/* Actions */}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Asset', 'Size', 'Entry / Current', 'Unrealized P/L', ''].map((h) => (
                <th key={h} className="text-left text-[11px] t-3 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {assets.map((asset) => {
              const pnl = calcAssetPnL(asset);
              const pos = pnl.unrealizedPnL >= 0;
              const isLong = (asset.direction ?? 'long') === 'long';
              const liqPrice = calcMarginCallPrice(asset);
              const distToLiq = liqPrice && asset.currentPrice > 0
                ? ((liqPrice - asset.currentPrice) / asset.currentPrice) * 100
                : null;

              return (
                <tr key={asset.id} className="table-row-hover transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>

                  {/* ① Asset + direction chips */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                        {asset.symbol.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        {/* Row 1: symbol + direction badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold t-1">{asset.symbol}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                            isLong ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'
                          }`}>
                            {isLong ? 'L' : 'S'}{asset.leverage && asset.leverage > 1 ? ` ${asset.leverage}×` : ''}
                          </span>
                          {/* capital + liq inline when present */}
                          {asset.capitalLeft ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
                              <Wallet size={8} className="text-teal-500" />
                              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">{fmtCurrency(asset.capitalLeft, 0)}</span>
                            </span>
                          ) : null}
                          {liqPrice ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                              <AlertTriangle size={8} className="text-red-500" />
                              <span className="text-[10px] font-semibold text-red-500">{fmtK(liqPrice)}</span>
                              {distToLiq !== null && <span className="text-[9px] text-red-400 ml-0.5">{distToLiq.toFixed(0)}%</span>}
                            </span>
                          ) : null}
                        </div>
                        {/* Row 2: full name */}
                        <div className="text-[11px] t-3 mt-0.5 truncate">{asset.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* ② Size: amount + cost */}
                  <td className="px-4 py-3.5">
                    <div className="text-[13px] t-1 font-medium">
                      {fmtNumber(asset.amount, asset.amount < 1 ? 4 : 2)}
                      <span className="text-[11px] t-3 ml-1">{asset.symbol}</span>
                    </div>
                    <div className="text-[11px] t-3 mt-0.5">{fmtCurrency(pnl.costBasis)}</div>
                  </td>

                  {/* ③ Entry / Current */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] t-3">
                      <span>Entry</span>
                      <span className="t-2 font-medium">{fmtCurrency(asset.entryPrice)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] t-3">Now</span>
                      <span className="text-[13px] t-1 font-medium">{fmtCurrency(asset.currentPrice)}</span>
                      {asset.change24h !== undefined && (
                        <span className={`text-[10px] font-medium ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {fmtPercent(asset.change24h)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* ④ P/L combined */}
                  <td className="px-4 py-3.5">
                    <div className={`text-[14px] font-bold leading-tight ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                      {fmtCurrency(pnl.unrealizedPnL)}
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                      {fmtPercent(pnl.unrealizedPnLPercent)}
                    </div>
                  </td>

                  {/* ⑤ Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onEdit(asset)}
                        className="p-1.5 rounded-lg t-3 hover:text-orange-500 transition-colors"
                        style={{ background: 'var(--surface-deep)' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => onDelete(asset.id)}
                        className="p-1.5 rounded-lg t-3 hover:text-red-500 transition-colors"
                        style={{ background: 'var(--surface-deep)' }}>
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
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={3} className="px-4 py-3 text-[11px] t-3 font-medium">Total</td>
                <td className="px-4 py-3">
                  <div className={`text-[14px] font-bold ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fmtCurrency(totalPnL)}
                  </div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${totalPnLPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fmtPercent(totalPnLPct)}
                  </div>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>

        {assets.length === 0 && (
          <div className="text-center py-12 t-3 text-sm">No assets yet. Click "Add Asset" to get started.</div>
        )}
      </div>
    </GlassCard>
  );
}

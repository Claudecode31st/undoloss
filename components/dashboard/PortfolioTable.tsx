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

export default function PortfolioTable({ assets, onAdd, onEdit, onDelete }: PortfolioTableProps) {
  const totalPnL = assets.reduce((sum, a) => sum + calcAssetPnL(a).unrealizedPnL, 0);
  const totalInvested = assets.reduce((sum, a) => sum + a.entryPrice * a.amount, 0);
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <GlassCard className="overflow-hidden h-full">
      {/* Card header */}
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

      {/* ── Mobile card list ── */}
      <div className="md:hidden">
        {assets.length === 0 && (
          <div className="text-center py-10 t-3 text-sm">No assets yet. Tap &quot;Add Asset&quot; to get started.</div>
        )}
        {assets.map((asset) => {
          const pnl = calcAssetPnL(asset);
          const pos = pnl.unrealizedPnL >= 0;
          return (
            <div key={asset.id} className="flex items-center gap-3 px-4 py-3 table-row-hover transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}>
              {/* Icon */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                {asset.symbol.slice(0, 1)}
              </div>

              {/* Name + price */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold t-1">{asset.symbol}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    (asset.direction ?? 'long') === 'long'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-red-500/15 text-red-500'
                  }`}>
                    {(asset.direction ?? 'long').toUpperCase()}
                  </span>
                  {asset.change24h !== undefined && (
                    <span className={`text-[10px] font-medium ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {fmtPercent(asset.change24h)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-[11px] t-3">{fmtCurrency(asset.currentPrice)}</span>
                  {asset.capitalLeft ? (
                    <span className="text-[9px] font-semibold px-1 py-0.5 rounded text-teal-600 dark:text-teal-400"
                      style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}>
                      💰 {fmtCurrency(asset.capitalLeft, 0)} left
                    </span>
                  ) : null}
                  {calcMarginCallPrice(asset) ? (
                    <span className="text-[9px] font-semibold px-1 py-0.5 rounded text-red-500"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      ⚡ Liq {fmtCurrency(calcMarginCallPrice(asset)!)}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* P/L */}
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-semibold ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtCurrency(pnl.unrealizedPnL)}
                </div>
                <div className={`text-[11px] font-medium ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtPercent(pnl.unrealizedPnLPercent)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
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
            </div>
          );
        })}

        {/* Mobile total row */}
        {assets.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-strong)' }}>
            <span className="text-xs t-3 font-medium">Total P/L</span>
            <div className="text-right">
              <span className={`text-sm font-bold ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtCurrency(totalPnL)}
              </span>
              <span className={`text-xs font-bold ml-2 ${totalPnLPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtPercent(totalPnLPct)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[18%]" />  {/* Asset */}
            <col className="w-[22%]" />  {/* Direction */}
            <col className="w-[12%]" />  {/* Amount */}
            <col className="w-[11%]" />  {/* Entry Price */}
            <col className="w-[14%]" />  {/* Current Price */}
            <col className="w-[11%]" />  {/* P/L $ */}
            <col className="w-[8%]"  />  {/* P/L % */}
            <col className="w-[6%]"  />  {/* Actions */}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Asset', 'Direction', 'Amount', 'Entry', 'Current', 'P/L', '%', ''].map((h) => (
                <th key={h} className="text-left text-[11px] t-3 font-medium px-3 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const pnl = calcAssetPnL(asset);
              const pos = pnl.unrealizedPnL >= 0;
              return (
                <tr key={asset.id} className="table-row-hover transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                        {asset.symbol.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold t-1 truncate">{asset.symbol}</div>
                        <div className="text-[10px] t-3 truncate">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {(() => {
                      const isLong = (asset.direction ?? 'long') === 'long';
                      const liqPrice = calcMarginCallPrice(asset);
                      const distToLiq = liqPrice && asset.currentPrice > 0
                        ? ((liqPrice - asset.currentPrice) / asset.currentPrice) * 100
                        : null;
                      const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;
                      return (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            isLong ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'
                          }`}>
                            {isLong ? 'L' : 'S'}{asset.leverage && asset.leverage > 1 ? ` ${asset.leverage}×` : ''}
                          </span>
                          {asset.capitalLeft ? (
                            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)' }}>
                              <Wallet size={7} className="text-teal-500" />
                              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                                {fmtCurrency(asset.capitalLeft, 0)}
                              </span>
                            </div>
                          ) : null}
                          {liqPrice && (
                            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                              <AlertTriangle size={7} className="text-red-500" />
                              <span className="text-[10px] font-semibold text-red-500">{fmtK(liqPrice)}</span>
                              {distToLiq !== null && (
                                <span className="text-[9px] text-red-400">{distToLiq.toFixed(0)}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm t-1 truncate">{fmtNumber(asset.amount, asset.amount < 1 ? 4 : 2)}</div>
                    <div className="text-[10px] t-3 truncate">{fmtCurrency(pnl.costBasis)}</div>
                  </td>
                  <td className="px-3 py-3 text-sm t-1 truncate">{fmtCurrency(asset.entryPrice)}</td>
                  <td className="px-3 py-3">
                    <div className="text-sm t-1 truncate">{fmtCurrency(asset.currentPrice)}</div>
                    {asset.change24h !== undefined && (
                      <div className={`text-[10px] font-medium ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {fmtPercent(asset.change24h)}
                      </div>
                    )}
                  </td>
                  <td className={`px-3 py-3 text-sm font-semibold ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fmtCurrency(pnl.unrealizedPnL)}
                  </td>
                  <td className={`px-3 py-3 text-sm font-semibold ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fmtPercent(pnl.unrealizedPnLPercent)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(asset)}
                        className="p-1 rounded-lg t-3 hover:text-orange-500 transition-colors" style={{ background: 'var(--surface-deep)' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => onDelete(asset.id)}
                        className="p-1 rounded-lg t-3 hover:text-red-500 transition-colors" style={{ background: 'var(--surface-deep)' }}>
                        <Trash2 size={12} />
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
                <td colSpan={5} className="px-3 py-3 text-xs t-3 font-medium">Total</td>
                <td className={`px-3 py-3 text-sm font-bold ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtCurrency(totalPnL)}
                </td>
                <td className={`px-3 py-3 text-sm font-bold ${totalPnLPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtPercent(totalPnLPct)}
                </td>
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

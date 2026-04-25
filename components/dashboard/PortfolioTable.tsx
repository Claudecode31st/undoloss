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
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold t-1 flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
          Portfolio P/L
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
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${isLong ? 'text-emerald-600' : 'text-red-500'}`}
                    style={{ background: isLong ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isLong ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
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

      {/* ── Desktop card-row list ── */}
      <div className="hidden md:block px-4 py-3 space-y-2">
        {assets.length === 0 && (
          <div className="text-center py-10 t-3 text-sm">No assets yet. Click "Add Asset" to get started.</div>
        )}

        {/* Column labels */}
        {assets.length > 0 && (
          <div className="flex items-center gap-3 px-3 pb-1">
            <div style={{ width: 28 }} />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] t-3 font-medium uppercase tracking-wide">Asset</span>
            </div>
            <div className="w-36 flex-shrink-0">
              <span className="text-[10px] t-3 font-medium uppercase tracking-wide">Size</span>
            </div>
            <div className="w-44 flex-shrink-0">
              <span className="text-[10px] t-3 font-medium uppercase tracking-wide">Entry / Current</span>
            </div>
            <div className="w-32 flex-shrink-0 text-right">
              <span className="text-[10px] t-3 font-medium uppercase tracking-wide">Unrealized P/L</span>
            </div>
            <div className="w-14 flex-shrink-0" />
          </div>
        )}

        {assets.map((asset) => {
          const pnl = calcAssetPnL(asset);
          const pos = pnl.unrealizedPnL >= 0;
          const isLong = (asset.direction ?? 'long') === 'long';
          const liqPrice = calcMarginCallPrice(asset);
          const distToLiq = liqPrice && asset.currentPrice > 0
            ? ((liqPrice - asset.currentPrice) / asset.currentPrice) * 100
            : null;

          return (
            <div key={asset.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:opacity-90"
              style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>

              {/* Avatar */}
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${asset.color}dd, ${asset.color}88)` }}>
                {asset.symbol.slice(0, 1)}
              </div>

              {/* Asset name + chips */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] font-semibold t-1 leading-tight">{asset.symbol}</span>
                  <span className="text-[11px] t-3 truncate">{asset.name}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                    isLong ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  }`} style={{
                    background: isLong ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${isLong ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                    {isLong ? 'L' : 'S'}{asset.leverage && asset.leverage > 1 ? ` ${asset.leverage}×` : ''}
                  </span>
                  {asset.capitalLeft ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none text-teal-600 dark:text-teal-400"
                      style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)' }}>
                      <Wallet size={8} />{fmtCurrency(asset.capitalLeft, 0)}
                    </span>
                  ) : null}
                  {liqPrice ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none text-red-500"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertTriangle size={8} />{fmtK(liqPrice)}
                      {distToLiq !== null && <span className="ml-0.5 text-red-400">{distToLiq.toFixed(0)}%</span>}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Size */}
              <div className="w-36 flex-shrink-0">
                <div className="text-[12px] t-1 font-medium leading-tight">
                  {fmtNumber(asset.amount, asset.amount < 1 ? 4 : 2)}
                  <span className="text-[10px] t-3 ml-1">{asset.symbol}</span>
                </div>
                <div className="text-[11px] t-3 mt-0.5">{fmtCurrency(pnl.costBasis)}</div>
              </div>

              {/* Entry / Current */}
              <div className="w-44 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] t-3 w-6">Entry</span>
                  <span className="text-[12px] t-2 font-medium">{fmtCurrency(asset.entryPrice)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] t-3 w-6">Now</span>
                  <span className="text-[12px] t-1 font-semibold">{fmtCurrency(asset.currentPrice)}</span>
                  {asset.change24h !== undefined && (
                    <span className={`text-[10px] font-medium ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {fmtPercent(asset.change24h)}
                    </span>
                  )}
                </div>
              </div>

              {/* P/L */}
              <div className="w-32 flex-shrink-0 text-right">
                <div className={`text-[13px] font-bold leading-tight ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtCurrency(pnl.unrealizedPnL)}
                </div>
                <div className={`text-[11px] font-semibold mt-0.5 ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtPercent(pnl.unrealizedPnLPercent)}
                </div>
              </div>

              {/* Actions */}
              <div className="w-14 flex-shrink-0 flex items-center justify-end gap-1">
                <button onClick={() => onEdit(asset)}
                  className="p-1.5 rounded-lg t-3 hover:text-orange-500 transition-colors"
                  style={{ background: 'var(--surface)' }}>
                  <Pencil size={12} />
                </button>
                <button onClick={() => onDelete(asset.id)}
                  className="p-1.5 rounded-lg t-3 hover:text-red-500 transition-colors"
                  style={{ background: 'var(--surface)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}

      </div>

    </GlassCard>
  );
}

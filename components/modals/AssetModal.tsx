'use client';
import { useState, useEffect } from 'react';
import { X, Search, Loader2, AlertTriangle } from 'lucide-react';
import { CryptoAsset, SUPPORTED_COINS } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { calcMarginCallPrice, calcInitialMargin, fmtCurrency } from '@/lib/calculations';

interface AssetModalProps {
  open: boolean;
  asset?: CryptoAsset | null;
  existingAssets?: CryptoAsset[];
  onClose: () => void;
  onSave: (asset: CryptoAsset) => void;
}

export default function AssetModal({ open, asset, existingAssets = [], onClose, onSave }: AssetModalProps) {
  const [symbol, setSymbol] = useState('');
  const [coinGeckoId, setCoinGeckoId] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f97316');
  const [amount, setAmount] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [capitalLeft, setCapitalLeft] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [hedgeFor, setHedgeFor] = useState('');
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [query, setQuery] = useState('');
  const isEdit = !!asset;

  // Long positions available to hedge (exclude the asset being edited)
  const hedgeableAssets = existingAssets.filter(
    a => (a.direction ?? 'long') === 'long' && a.id !== asset?.id,
  );

  useEffect(() => {
    if (asset) {
      setSymbol(asset.symbol); setName(asset.name); setCoinGeckoId(asset.coinGeckoId);
      setColor(asset.color); setAmount(String(asset.amount));
      setEntryPrice(String(asset.entryPrice)); setCurrentPrice(String(asset.currentPrice));
      setDirection(asset.direction ?? 'long');
      setCapitalLeft(asset.capitalLeft ? String(asset.capitalLeft) : '');
      setLeverage(String(asset.leverage ?? 1));
      setHedgeFor(asset.hedgeFor ?? '');
    } else {
      setSymbol(''); setName(''); setCoinGeckoId(''); setColor('#f97316');
      setAmount(''); setEntryPrice(''); setCurrentPrice('');
      setDirection('long'); setCapitalLeft(''); setLeverage('1'); setHedgeFor('');
    }
    setQuery('');
  }, [asset, open]);

  const selectCoin = async (coin: typeof SUPPORTED_COINS[0]) => {
    setSymbol(coin.symbol); setName(coin.name); setCoinGeckoId(coin.coinGeckoId); setColor(coin.color); setQuery('');
    try {
      setFetchingPrice(true);
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.coinGeckoId}&vs_currencies=usd`);
      if (res.ok) {
        const data = await res.json();
        if (data[coin.coinGeckoId]?.usd) setCurrentPrice(String(data[coin.coinGeckoId].usd));
      }
    } catch { /* ignore */ } finally { setFetchingPrice(false); }
  };

  const filteredCoins = SUPPORTED_COINS.filter(
    (c) => c.symbol.toLowerCase().includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase())
  );

  const leverageNum = Math.max(1, Math.min(100, parseInt(leverage) || 1));
  const entryNum = parseFloat(entryPrice) || 0;
  const currentNum = parseFloat(currentPrice) || 0;

  // Position preview
  const previewAsset: CryptoAsset = {
    id: '', symbol, name, coinGeckoId, color,
    amount: parseFloat(amount) || 0,
    entryPrice: entryNum,
    currentPrice: currentNum,
    direction,
    leverage: leverageNum,
  };
  const marginCall = leverageNum > 1 ? calcMarginCallPrice(previewAsset) : null;

  // Is the current price already past the isolated-margin liq trigger?
  // Long: liq is below entry — if current < liqPrice, already crossed it
  // Short: liq is above entry — if current > liqPrice, already crossed it
  const alreadyPastIsolatedLiq = marginCall !== null && currentNum > 0 && (
    (direction === 'long'  && currentNum <= marginCall) ||
    (direction === 'short' && currentNum >= marginCall)
  );

  // How far current price still needs to move to hit isolated liq (only meaningful when not past it)
  const distToMarginCall = marginCall && currentNum > 0 && !alreadyPastIsolatedLiq
    ? direction === 'long'
      ? ((currentNum - marginCall) / currentNum) * 100   // current above liq → positive = safe distance
      : ((marginCall - currentNum) / currentNum) * 100   // current below liq → positive = safe distance
    : null;
  // Initial margin required for this position
  const initialMargin = leverageNum > 1 && entryNum > 0 && previewAsset.amount > 0
    ? calcInitialMargin(previewAsset)
    : null;
  const notionalValue = entryNum > 0 && previewAsset.amount > 0
    ? entryNum * previewAsset.amount
    : null;

  const handleSave = () => {
    const parsed: CryptoAsset = {
      id: asset?.id ?? generateId(), symbol: symbol.toUpperCase(), name, coinGeckoId,
      amount: parseFloat(amount) || 0, entryPrice: entryNum,
      currentPrice: currentNum, color, direction,
      leverage: leverageNum > 1 ? leverageNum : undefined,
      ...(capitalLeft ? { capitalLeft: parseFloat(capitalLeft) } : {}),
      ...(direction === 'short' && hedgeFor ? { hedgeFor } : {}),
    };
    if (!parsed.symbol || parsed.amount <= 0 || parsed.entryPrice <= 0) return;
    onSave(parsed);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold t-1">{isEdit ? 'Edit Asset' : 'Add Asset'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg t-3 hover:t-1 transition-colors"
            style={{ background: 'var(--surface-deep)' }}>
            <X size={16} />
          </button>
        </div>

        {!isEdit && (
          <div className="mb-4">
            <label className="text-xs t-2 mb-1.5 block">Select Coin</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 t-3" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search coins..." className="glass-input w-full rounded-xl pl-8 pr-3 py-2 text-sm" />
            </div>
            {(query || !symbol) && (
              <div className="mt-1.5 glass rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {filteredCoins.map((c) => (
                  <button key={c.coinGeckoId} onClick={() => selectCoin(c)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                    <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm font-medium t-1">{c.symbol}</span>
                    <span className="text-xs t-3">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
            {symbol && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 glass-dark rounded-xl">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold t-1">{symbol}</span>
                <span className="text-xs t-3">{name}</span>
              </div>
            )}
          </div>
        )}

        {/* Direction toggle */}
        <div className="mb-4">
          <label className="text-xs t-2 mb-1.5 block">Position Direction</label>
          <div className="grid grid-cols-2 gap-2">
            {(['long', 'short'] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                  direction === d
                    ? d === 'long'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-500'
                      : 'bg-red-500/20 border border-red-500/40 text-red-500'
                    : 't-3 hover:t-2'
                }`}
                style={direction !== d ? { border: '1px solid var(--border)', background: 'var(--surface-deep)' } : undefined}>
                {d === 'long' ? '↑ Long' : '↓ Short'}
              </button>
            ))}
          </div>
        </div>

        {/* Hedge link — only for short positions when there are longs to link to */}
        {direction === 'short' && hedgeableAssets.length > 0 && (
          <div className="mb-4">
            <label className="text-xs t-2 mb-1.5 block">
              Hedges position <span className="t-3 text-[10px]">(optional — links this short to a long for TSI signals)</span>
            </label>
            <div className="grid gap-1.5">
              <button
                type="button"
                onClick={() => setHedgeFor('')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                  hedgeFor === '' ? 'border-orange-500/40 text-orange-500' : 't-3 hover:t-2'
                }`}
                style={{
                  border: `1px solid ${hedgeFor === '' ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
                  background: hedgeFor === '' ? 'rgba(249,115,22,0.08)' : 'var(--surface-deep)',
                }}
              >
                <span className="text-base leading-none">—</span>
                <span className="text-sm">Standalone short (no hedge link)</span>
              </button>
              {hedgeableAssets.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setHedgeFor(a.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                    hedgeFor === a.id ? 'border-orange-500/40' : 't-2 hover:t-1'
                  }`}
                  style={{
                    border: `1px solid ${hedgeFor === a.id ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
                    background: hedgeFor === a.id ? 'rgba(249,115,22,0.08)' : 'var(--surface-deep)',
                  }}
                >
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: a.color }}>
                    {a.symbol.slice(0, 1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold t-1">{a.symbol}</span>
                    <span className="text-[11px] t-3 ml-1.5">{a.name} · Long</span>
                  </div>
                  {hedgeFor === a.id && <span className="text-orange-500 text-xs font-semibold">Selected</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs t-2 mb-1.5 block">Amount (tokens)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs t-2 mb-1.5 block">Entry Price (USD)</label>
            <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs t-2 mb-1.5 flex items-center gap-1.5 block">
              Current Price (USD)
              {fetchingPrice && <Loader2 size={11} className="animate-spin text-orange-400" />}
              {!fetchingPrice && <span className="t-3 text-[10px]">(auto-fetched)</span>}
            </label>
            <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="0.00" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
          </div>

          {/* Leverage */}
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs t-2">Leverage</label>
              <span className={`text-sm font-bold ${leverageNum > 10 ? 'text-red-500' : leverageNum > 3 ? 'text-orange-500' : 'text-emerald-500'}`}>
                {leverageNum}×
              </span>
            </div>
            <input type="range" min={1} max={100} step={1} value={leverageNum}
              onChange={(e) => setLeverage(e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-1"
              style={{ background: `linear-gradient(to right, ${leverageNum > 10 ? '#ef4444' : leverageNum > 3 ? '#f97316' : '#22c55e'} ${leverageNum}%, var(--border-strong) ${leverageNum}%)` }} />
            <div className="flex justify-between text-[10px] t-3"><span>1×</span><span>10×</span><span>25×</span><span>50×</span><span>100×</span></div>
          </div>

          {/* Position margin breakdown */}
          {leverageNum > 1 && entryNum > 0 && previewAsset.amount > 0 && (
            <div className="col-span-2 rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}>
              {/* Margin stats row */}
              <div className="grid grid-cols-3 divide-x text-center py-2.5" style={{ borderColor: 'var(--border)' }}>
                <div className="px-2">
                  <div className="text-[9px] t-3 uppercase tracking-wide">Notional</div>
                  <div className="text-xs font-bold t-1 mt-0.5">{notionalValue ? fmtCurrency(notionalValue, 0) : '—'}</div>
                </div>
                <div className="px-2">
                  <div className="text-[9px] t-3 uppercase tracking-wide">Margin Required</div>
                  <div className="text-xs font-bold text-teal-400 mt-0.5">{initialMargin ? fmtCurrency(initialMargin, 0) : '—'}</div>
                </div>
                <div className="px-2">
                  <div className="text-[9px] t-3 uppercase tracking-wide">Isolated Liq</div>
                  <div className="text-xs font-bold text-red-400 mt-0.5">{marginCall ? fmtCurrency(marginCall, 0) : '—'}</div>
                </div>
              </div>
              {/* Liq warning */}
              {marginCall !== null && currentNum > 0 && (
                <div className="px-3 py-2 border-t flex items-start gap-2" style={{
                  borderColor: 'var(--border)',
                  background: alreadyPastIsolatedLiq ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
                }}>
                  <AlertTriangle size={11} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] leading-snug">
                    {alreadyPastIsolatedLiq ? (
                      <>
                        <span className="text-red-400 font-semibold">Current price is past isolated liq ({fmtCurrency(marginCall, 0)})</span>
                        <span className="t-3"> — on isolated margin this position would be liquidated. You must be on </span>
                        <span className="text-orange-400 font-semibold">cross-margin</span>
                        <span className="t-3">, where the full account balance acts as buffer and extends your liq further.</span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-400 font-semibold">Isolated margin liq</span>
                        <span className="t-3"> at {fmtCurrency(marginCall)} — price needs to{' '}
                          {direction === 'long' ? 'drop' : 'rise'} {Math.abs(distToMarginCall ?? 0).toFixed(1)}% from current to trigger.{' '}
                          Cross-margin liq will be further away (full account balance as buffer).
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="col-span-2">
            <label className="text-xs t-2 mb-1.5 block">
              Notes <span className="t-3 text-[10px]">(optional — e.g. isolated margin reserved)</span>
            </label>
            <input type="number" value={capitalLeft} onChange={(e) => setCapitalLeft(e.target.value)}
              placeholder="e.g. 500" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm t-2 hover:t-1 transition-colors"
            style={{ border: '1px solid var(--border-strong)', background: 'var(--surface-deep)' }}>
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:from-orange-400 hover:to-orange-500 transition-all">
            {isEdit ? 'Save Changes' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

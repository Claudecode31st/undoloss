'use client';
import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { CryptoAsset, SUPPORTED_COINS } from '@/lib/types';
import { generateId } from '@/lib/storage';

interface AssetModalProps {
  open: boolean;
  asset?: CryptoAsset | null;
  onClose: () => void;
  onSave: (asset: CryptoAsset) => void;
}

export default function AssetModal({ open, asset, onClose, onSave }: AssetModalProps) {
  const [symbol, setSymbol] = useState('');
  const [coinGeckoId, setCoinGeckoId] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f97316');
  const [amount, setAmount] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [query, setQuery] = useState('');

  const isEdit = !!asset;

  useEffect(() => {
    if (asset) {
      setSymbol(asset.symbol);
      setName(asset.name);
      setCoinGeckoId(asset.coinGeckoId);
      setColor(asset.color);
      setAmount(String(asset.amount));
      setEntryPrice(String(asset.entryPrice));
      setCurrentPrice(String(asset.currentPrice));
    } else {
      setSymbol(''); setName(''); setCoinGeckoId(''); setColor('#f97316');
      setAmount(''); setEntryPrice(''); setCurrentPrice('');
    }
    setQuery('');
  }, [asset, open]);

  const selectCoin = async (coin: typeof SUPPORTED_COINS[0]) => {
    setSymbol(coin.symbol);
    setName(coin.name);
    setCoinGeckoId(coin.coinGeckoId);
    setColor(coin.color);
    setQuery('');
    // Fetch live price
    try {
      setFetchingPrice(true);
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.coinGeckoId}&vs_currencies=usd`);
      if (res.ok) {
        const data = await res.json();
        if (data[coin.coinGeckoId]?.usd) {
          setCurrentPrice(String(data[coin.coinGeckoId].usd));
        }
      }
    } catch {
      // ignore — user can enter manually
    } finally {
      setFetchingPrice(false);
    }
  };

  const filteredCoins = SUPPORTED_COINS.filter(
    (c) =>
      c.symbol.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSave = () => {
    const parsed = {
      id: asset?.id ?? generateId(),
      symbol: symbol.toUpperCase(),
      name,
      coinGeckoId,
      amount: parseFloat(amount) || 0,
      entryPrice: parseFloat(entryPrice) || 0,
      currentPrice: parseFloat(currentPrice) || 0,
      color,
    };
    if (!parsed.symbol || parsed.amount <= 0 || parsed.entryPrice <= 0) return;
    onSave(parsed);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Asset' : 'Add Asset'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Coin selector */}
        {!isEdit && (
          <div className="mb-4">
            <label className="text-xs text-zinc-400 mb-1.5 block">Select Coin</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search coins..."
                className="glass-input w-full rounded-xl pl-8 pr-3 py-2 text-sm"
              />
            </div>
            {(query || !symbol) && (
              <div className="mt-1.5 glass rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {filteredCoins.map((c) => (
                  <button
                    key={c.coinGeckoId}
                    onClick={() => selectCoin(c)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-700/50 transition-colors text-left"
                  >
                    <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm font-medium text-white">{c.symbol}</span>
                    <span className="text-xs text-zinc-500">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
            {symbol && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 glass-dark rounded-xl">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-white">{symbol}</span>
                <span className="text-xs text-zinc-500">{name}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Entry Price (USD)</label>
            <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5 block">
              Current Price (USD)
              {fetchingPrice && <Loader2 size={11} className="animate-spin text-orange-400" />}
              {!fetchingPrice && <span className="text-zinc-600 text-[10px]">(auto-fetched from CoinGecko)</span>}
            </label>
            <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="0.00" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700/50 text-zinc-400 text-sm hover:text-white hover:border-zinc-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:from-orange-400 hover:to-orange-500 transition-all"
          >
            {isEdit ? 'Save Changes' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

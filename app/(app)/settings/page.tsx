'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, RefreshCw, Info } from 'lucide-react';
import { loadPortfolio, savePortfolio, generateId } from '@/lib/storage';
import { Portfolio, Position, SUPPORTED_COINS } from '@/lib/types';
import GlassCard from '@/components/ui/GlassCard';

const COIN_MAP = Object.fromEntries(SUPPORTED_COINS.map(c => [c.symbol, c]));

function PositionRow({
  pos,
  onChange,
  onDelete,
}: {
  pos: Position;
  onChange: (p: Position) => void;
  onDelete: () => void;
}) {
  const coin = COIN_MAP[pos.symbol];

  return (
    <div className="rounded-xl p-3 space-y-2"
      style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <select
          value={pos.symbol}
          onChange={e => {
            const c = COIN_MAP[e.target.value];
            if (c) onChange({ ...pos, symbol: c.symbol, coinGeckoId: c.coinGeckoId, color: c.color });
          }}
          className="glass-input px-2 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0"
        >
          {SUPPORTED_COINS.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
        </select>

        <select
          value={pos.direction}
          onChange={e => onChange({ ...pos, direction: e.target.value as 'long' | 'short' })}
          className="glass-input px-2 py-1.5 rounded-lg text-sm flex-shrink-0"
        >
          <option value="long">LONG</option>
          <option value="short">SHORT</option>
        </select>

        <button onClick={onDelete} className="ml-auto p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Size', field: 'size', placeholder: '0.417', step: 'any' },
          { label: 'Entry Price ($)', field: 'entryPrice', placeholder: '119633', step: 'any' },
          { label: 'Current Price ($)', field: 'currentPrice', placeholder: '77651', step: 'any' },
          { label: 'Leverage', field: 'leverage', placeholder: '100', step: '1' },
        ].map(({ label, field, placeholder, step }) => (
          <div key={field}>
            <label className="text-[10px] t-3 block mb-0.5">{label}</label>
            <input
              type="number"
              min={0}
              step={step}
              value={(pos as unknown as Record<string, number>)[field] || ''}
              onChange={e => onChange({ ...pos, [field]: parseFloat(e.target.value) || 0 })}
              className="glass-input w-full px-2 py-1.5 rounded-lg text-sm"
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPortfolio(loadPortfolio()); }, []);

  if (!portfolio) return <div className="t-3 p-8 text-center">Loading...</div>;

  const update = (p: Portfolio) => setPortfolio(p);

  const addPosition = () => {
    const coin = SUPPORTED_COINS[0];
    const newPos: Position = {
      id: generateId(),
      symbol: coin.symbol,
      coinGeckoId: coin.coinGeckoId,
      direction: 'long',
      size: 0,
      entryPrice: 0,
      currentPrice: 0,
      leverage: 100,
      color: coin.color,
    };
    update({ ...portfolio, positions: [...portfolio.positions, newPos] });
  };

  const updatePos = (id: string, pos: Position) => {
    update({ ...portfolio, positions: portfolio.positions.map(p => p.id === id ? pos : p) });
  };

  const deletePos = (id: string) => {
    update({ ...portfolio, positions: portfolio.positions.filter(p => p.id !== id) });
  };

  const handleSave = () => {
    savePortfolio(portfolio);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset to your default Bybit positions? Your edits will be lost.')) {
      localStorage.removeItem('undoloss_v2');
      setPortfolio(loadPortfolio());
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="mb-2">
        <h1 className="text-xl font-bold t-1">Settings</h1>
        <p className="text-sm t-3 mt-1">Edit your positions and account details</p>
      </div>

      {/* Account */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold t-1 mb-3">Account (Bybit Cross-Margin)</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] t-3 block mb-1">Wallet Balance (USDT)</label>
            <input
              type="number"
              value={portfolio.account.walletBalance || ''}
              onChange={e => update({ ...portfolio, account: { ...portfolio.account, walletBalance: parseFloat(e.target.value) || 0 } })}
              className="glass-input w-full px-3 py-2 rounded-xl text-sm font-semibold"
              placeholder="50281.39"
            />
            <p className="text-[10px] t-3 mt-1">From Bybit Assets → Derivatives → Wallet Balance</p>
          </div>
          <div>
            <label className="text-[11px] t-3 block mb-1">Available Balance (USDT)</label>
            <input
              type="number"
              value={portfolio.account.availableBalance || ''}
              onChange={e => update({ ...portfolio, account: { ...portfolio.account, availableBalance: parseFloat(e.target.value) || 0 } })}
              className="glass-input w-full px-3 py-2 rounded-xl text-sm font-semibold"
              placeholder="3674.61"
            />
            <p className="text-[10px] t-3 mt-1">From Bybit Trade tab → Available</p>
          </div>
        </div>
      </GlassCard>

      {/* Positions */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold t-1">Positions</h2>
          <button onClick={addPosition}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
            <Plus size={12} /> Add Position
          </button>
        </div>

        <div className="space-y-2">
          {portfolio.positions.map(pos => (
            <PositionRow
              key={pos.id}
              pos={pos}
              onChange={p => updatePos(pos.id, p)}
              onDelete={() => deletePos(pos.id)}
            />
          ))}
          {portfolio.positions.length === 0 && (
            <div className="text-center py-6 t-3 text-sm">
              No positions yet. Click &quot;Add Position&quot; to start.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Info note */}
      <div className="flex items-start gap-2 rounded-xl p-3 text-[11px] t-2"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Info size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          Current prices are auto-fetched from CoinGecko. You can override them manually here.
          Changes take effect when you save and return to Dashboard.
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: saved ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.12)',
            border: `1px solid ${saved ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)'}`,
            color: saved ? '#22c55e' : '#f97316',
          }}>
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
        <button onClick={handleReset}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>
          <RefreshCw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}

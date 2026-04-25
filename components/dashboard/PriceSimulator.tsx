'use client';
import { useState, useCallback } from 'react';
import { PairInfo } from '@/lib/types';
import { calcSimulation, calcEquity, fmtUSD, fmtUSDFull, fmtPct } from '@/lib/calculations';
import { Account } from '@/lib/types';
import { Calculator } from 'lucide-react';

interface Props {
  pairs: PairInfo[];
  account: Account;
}

export default function PriceSimulator({ pairs, account }: Props) {
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(pairs.map(p => [p.symbol, String(p.long.currentPrice)]))
  );

  const targetPrices = Object.fromEntries(
    Object.entries(prices).map(([sym, v]) => [sym, parseFloat(v) || 0])
  );

  const results = calcSimulation(pairs, targetPrices);
  const totalSimPnL = results.reduce((s, r) => s + r.pairPnL, 0);
  const simEquity = account.walletBalance + totalSimPnL;

  const currentPnl = pairs.reduce(
    (s, p) => s + p.longPnL.unrealizedPnL + p.shortPnL.unrealizedPnL, 0
  );
  const { equity: currentEquity } = calcEquity(account, pairs.flatMap(p => [p.long, p.short]));
  const equityChange = simEquity - currentEquity;

  const setPrice = useCallback((sym: string, val: string) => {
    setPrices(prev => ({ ...prev, [sym]: val }));
  }, []);

  const resetPrices = () => {
    setPrices(Object.fromEntries(pairs.map(p => [p.symbol, String(p.long.currentPrice)])));
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold t-1 text-base flex items-center gap-2">
            <Calculator size={16} className="text-blue-400" />
            Price Simulator
          </h2>
          <p className="text-[11px] t-3 mt-0.5">
            Set target prices to see how your positions would perform
          </p>
        </div>
        <button onClick={resetPrices}
          className="text-[11px] px-2.5 py-1.5 rounded-lg t-3 hover:t-1 transition-colors"
          style={{ border: '1px solid var(--border)' }}>
          Reset
        </button>
      </div>

      {/* Price inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {pairs.map(p => {
          const tPrice = parseFloat(prices[p.symbol]) || p.long.currentPrice;
          const pctChange = p.long.currentPrice > 0
            ? ((tPrice - p.long.currentPrice) / p.long.currentPrice) * 100 : 0;

          return (
            <div key={p.symbol} className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: p.color }}>
                    {p.symbol.slice(0, 1)}
                  </div>
                  <span className="text-sm font-semibold t-1">{p.symbol}</span>
                  <span className="text-[10px] t-3">Now: ${p.long.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <span className={`text-[11px] font-semibold ${pctChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm t-3">$</span>
                <input
                  type="number"
                  value={prices[p.symbol]}
                  onChange={e => setPrice(p.symbol, e.target.value)}
                  className="glass-input flex-1 px-2 py-1.5 rounded-lg text-sm font-mono font-semibold"
                  placeholder={String(p.long.currentPrice)}
                  min={0}
                />
              </div>
              {/* Quick presets */}
              <div className="flex gap-1 mt-2">
                {[-20, -10, -5, +5, +10, +20].map(pct => (
                  <button key={pct}
                    onClick={() => setPrice(p.symbol, String(Math.round(p.long.currentPrice * (1 + pct / 100))))}
                    className={`flex-1 text-[9px] py-0.5 rounded font-semibold transition-colors ${
                      pct < 0 ? 'text-blue-400 hover:bg-blue-500/10' : 'text-orange-400 hover:bg-orange-500/10'
                    }`}
                    style={{ border: '1px solid var(--border)' }}>
                    {pct > 0 ? '+' : ''}{pct}%
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Results */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 text-[11px] font-semibold t-2" style={{ background: 'var(--surface-deep)', borderBottom: '1px solid var(--border)' }}>
          Simulation Results
        </div>
        <div className="p-3 space-y-2">
          {results.map((r, i) => {
            const pair = pairs[i];
            return (
              <div key={r.symbol} className="grid grid-cols-4 gap-2 text-[11px]">
                <div className="font-semibold t-1">{r.symbol}</div>
                <div className={r.longPnL >= 0 ? 'text-emerald-500' : 'text-red-400'}>
                  Long: {r.longPnL >= 0 ? '+' : ''}{fmtUSD(r.longPnL)}
                </div>
                <div className={r.shortPnL >= 0 ? 'text-emerald-500' : 'text-red-400'}>
                  Short: {r.shortPnL >= 0 ? '+' : ''}{fmtUSD(r.shortPnL)}
                </div>
                <div className={`font-semibold ${r.pairPnL >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                  Pair: {r.pairPnL >= 0 ? '+' : ''}{fmtUSD(r.pairPnL)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-3 py-2 flex items-center justify-between text-sm font-bold"
          style={{ background: 'var(--surface-deep)', borderTop: '1px solid var(--border)' }}>
          <span className="t-2">Total equity at these prices</span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${equityChange >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {equityChange >= 0 ? '+' : ''}{fmtUSD(equityChange)} vs now
            </span>
            <span className={simEquity >= currentEquity ? 'text-emerald-500' : 'text-red-400'}>
              {fmtUSDFull(simEquity)}
            </span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-3 space-y-1">
        {results.map(r => {
          const pair = pairs.find(p => p.symbol === r.symbol)!;
          const tPrice = targetPrices[r.symbol];
          let insight = '';
          if (tPrice <= pair.short.entryPrice)
            insight = `✓ ${r.symbol} SHORT breaks even — consider closing it`;
          else if (tPrice >= pair.long.entryPrice)
            insight = `✓ ${r.symbol} LONG breaks even — consider closing it`;
          else if (r.longPnL > 0)
            insight = `${r.symbol} LONG is profitable at this price`;
          else if (r.shortPnL > 0)
            insight = `${r.symbol} SHORT is profitable at this price`;

          return insight ? (
            <div key={r.symbol} className="text-[11px] px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
              {insight}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

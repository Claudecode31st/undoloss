'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Portfolio, PairInfo } from '@/lib/types';
import { loadPortfolio, savePortfolio } from '@/lib/storage';
import { calcPairInfo, calcStrategies, calcEquity } from '@/lib/calculations';
import { fetchPrices } from '@/lib/coingecko';
import AccountBar from '@/components/dashboard/AccountBar';
import PositionPairCard from '@/components/dashboard/PositionPairCard';
import DeltaNeutralExplainer from '@/components/dashboard/DeltaNeutralExplainer';
import RecoveryStrategies from '@/components/dashboard/RecoveryStrategies';
import PriceSimulator from '@/components/dashboard/PriceSimulator';

// ─── Group positions into long+short pairs by symbol ──────────────────────────
function buildPairs(portfolio: Portfolio): PairInfo[] {
  const pairs: PairInfo[] = [];
  const symbols = [...new Set(portfolio.positions.map(p => p.symbol))];

  for (const sym of symbols) {
    const longs  = portfolio.positions.filter(p => p.symbol === sym && p.direction === 'long');
    const shorts = portfolio.positions.filter(p => p.symbol === sym && p.direction === 'short');
    if (longs.length > 0 && shorts.length > 0) {
      pairs.push(calcPairInfo(longs[0], shorts[0]));
    }
  }
  return pairs;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Load on mount
  useEffect(() => {
    const p = loadPortfolio();
    setPortfolio(p);
    setLastUpdated(p.lastUpdated);
  }, []);

  // Refresh prices from CoinGecko
  const refreshPrices = useCallback(async () => {
    if (!portfolio) return;
    setRefreshing(true);
    try {
      const ids = [...new Set(portfolio.positions.map(p => p.coinGeckoId))];
      const prices = await fetchPrices(ids);
      setPortfolio(prev => {
        if (!prev) return prev;
        const updated: Portfolio = {
          ...prev,
          positions: prev.positions.map(pos => ({
            ...pos,
            currentPrice: prices[pos.coinGeckoId]?.usd ?? pos.currentPrice,
          })),
          lastUpdated: new Date().toISOString(),
        };
        savePortfolio(updated);
        return updated;
      });
      setLastUpdated(new Date().toISOString());
    } catch { /* keep stale */ }
    finally { setRefreshing(false); }
  }, [portfolio]);

  // Auto-refresh every 60 s
  useEffect(() => {
    refreshPrices();
    const id = setInterval(refreshPrices, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="t-3 text-sm animate-pulse">Loading positions…</div>
      </div>
    );
  }

  const pairs = buildPairs(portfolio);
  const { equity } = calcEquity(portfolio.account, portfolio.positions);
  const strategies = pairs.length > 0 ? calcStrategies(pairs, portfolio.account) : [];

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  return (
    <div className="space-y-4">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold t-1">Recovery Dashboard</h1>
          <p className="text-[11px] t-3">Last updated {fmtTime(lastUpdated)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshPrices} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium t-2 hover:t-1 transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}>
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium t-2 hover:t-1 transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}>
            <Settings size={12} />
            Edit Positions
          </Link>
        </div>
      </div>

      {/* ── Account status ── */}
      <AccountBar account={portfolio.account} positions={portfolio.positions} />

      {/* ── No pairs warning ── */}
      {pairs.length === 0 && (
        <div className="glass rounded-2xl p-6 text-center">
          <AlertTriangle size={24} className="text-orange-400 mx-auto mb-2" />
          <div className="font-semibold t-1 mb-1">No delta-neutral pairs detected</div>
          <div className="text-sm t-3 mb-3">
            Add both a LONG and SHORT position for the same asset to see pair analysis.
          </div>
          <Link href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
            <Settings size={14} />
            Configure Positions
          </Link>
        </div>
      )}

      {pairs.length > 0 && (
        <>
          {/* ── Position pairs ── */}
          <div>
            <h2 className="text-sm font-semibold t-2 mb-2">Position Pairs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pairs.map(pair => (
                <PositionPairCard key={pair.symbol} pair={pair} />
              ))}
            </div>
          </div>

          {/* ── Why you're locked ── */}
          <DeltaNeutralExplainer pairs={pairs} />

          {/* ── Recovery strategies ── */}
          <RecoveryStrategies
            strategies={strategies}
            currentEquity={equity}
            walletBalance={portfolio.account.walletBalance}
          />

          {/* ── Price simulator ── */}
          <PriceSimulator pairs={pairs} account={portfolio.account} />
        </>
      )}

      {/* ── Disclaimer ── */}
      <div className="text-[10px] t-3 text-center pb-2">
        Educational tool only — not financial advice. Always verify with your exchange before trading.
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { loadPortfolio, savePortfolio } from './storage';
import { fetchPrices } from './coingecko';
import { Portfolio } from './types';

export function usePortfolioRefresh() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const p = loadPortfolio();
    setPortfolio(p);
    setLastUpdated(p.lastUpdated);
  }, []);

  useEffect(() => {
    if (portfolio) savePortfolio(portfolio);
  }, [portfolio]);

  const refresh = useCallback(async () => {
    if (!portfolio) return;
    setRefreshing(true);
    try {
      const ids = portfolio.assets.map((a) => a.coinGeckoId);
      const prices = await fetchPrices(ids);
      setPortfolio((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assets: prev.assets.map((a) => ({
            ...a,
            currentPrice: prices[a.coinGeckoId]?.usd ?? a.currentPrice,
            change24h: prices[a.coinGeckoId]?.usd_24h_change ?? a.change24h,
          })),
        };
      });
      const now = new Date().toISOString();
      setLastUpdated(now);
    } catch {
      // silently fail — keep existing prices
    } finally {
      setRefreshing(false);
    }
  }, [portfolio]);

  return { portfolio, setPortfolio, refreshing, lastUpdated, refresh };
}

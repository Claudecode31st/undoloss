'use client';
import { Portfolio } from './types';

const KEY = 'undoloss_v2';

// ─── Default portfolio: user's actual Bybit positions ─────────────────────────
const DEFAULT: Portfolio = {
  positions: [
    {
      id: 'btc-long',
      symbol: 'BTC',
      coinGeckoId: 'bitcoin',
      direction: 'long',
      size: 0.417,
      entryPrice: 119633.09,
      currentPrice: 77651.42,
      leverage: 100,
      color: '#f97316',
    },
    {
      id: 'btc-short',
      symbol: 'BTC',
      coinGeckoId: 'bitcoin',
      direction: 'short',
      size: 0.417,
      entryPrice: 62650.80,
      currentPrice: 77651.42,
      leverage: 100,
      color: '#f97316',
    },
    {
      id: 'sol-long',
      symbol: 'SOL',
      coinGeckoId: 'solana',
      direction: 'long',
      size: 160,
      entryPrice: 217.117,
      currentPrice: 86.371,
      leverage: 100,
      color: '#22c55e',
    },
    {
      id: 'sol-short',
      symbol: 'SOL',
      coinGeckoId: 'solana',
      direction: 'short',
      size: 160,
      entryPrice: 78.066,
      currentPrice: 86.371,
      leverage: 100,
      color: '#22c55e',
    },
  ],
  account: {
    walletBalance: 50281.39,
    availableBalance: 3674.61,
  },
  lastUpdated: new Date().toISOString(),
};

export function loadPortfolio(): Portfolio {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return JSON.parse(raw) as Portfolio;
  } catch {
    return DEFAULT;
  }
}

export function savePortfolio(p: Portfolio): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, lastUpdated: new Date().toISOString() }));
  } catch { /* ignore quota */ }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

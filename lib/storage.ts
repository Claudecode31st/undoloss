'use client';
import { Portfolio, CryptoAsset, Prefs } from './types';

const KEY = 'ccrs_portfolio';

const DEFAULT_PORTFOLIO: Portfolio = {
  assets: [
    { id: '1', symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin', amount: 0.45, entryPrice: 28516, currentPrice: 24935.6, color: '#f97316', change24h: 1.25 },
    { id: '2', symbol: 'ETH', name: 'Ethereum', coinGeckoId: 'ethereum', amount: 4.25, entryPrice: 2001.5, currentPrice: 1711.35, color: '#6366f1', change24h: 0.85 },
    { id: '3', symbol: 'SOL', name: 'Solana', coinGeckoId: 'solana', amount: 12.8, entryPrice: 192, currentPrice: 153.8, color: '#22c55e', change24h: 3.45 },
    { id: '4', symbol: 'LINK', name: 'Chainlink', coinGeckoId: 'chainlink', amount: 50, entryPrice: 24, currentPrice: 16.35, color: '#06b6d4', change24h: 1.15 },
  ],
  strategy: 'delta-neutral',
  riskMode: 'balanced',
  hedgeRatio: 50,
  lastUpdated: new Date().toISOString(),
};

export function loadPortfolio(): Portfolio {
  if (typeof window === 'undefined') return DEFAULT_PORTFOLIO;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PORTFOLIO;
    return JSON.parse(raw) as Portfolio;
  } catch {
    return DEFAULT_PORTFOLIO;
  }
}

export function savePortfolio(portfolio: Portfolio): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...portfolio, lastUpdated: new Date().toISOString() }));
  } catch {
    // ignore quota errors
  }
}

export function exportPortfolio(portfolio: Portfolio): void {
  const blob = new Blob([JSON.stringify(portfolio, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ccrs-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importPortfolio(file: File): Promise<Portfolio> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Portfolio;
        resolve(data);
      } catch {
        reject(new Error('Invalid portfolio file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const RECOVERY_KEY = 'ccrs_recovery';

export function loadRecoveryTarget(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RECOVERY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveRecoveryTarget(target: number): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(target)); } catch { /* ignore */ }
}

const PREFS_KEY = 'ccrs_prefs';
const DEFAULT_PREFS: Prefs = {
  show24hChange: true,
  showScenarioOutlook: true,
  showConcentrationRisk: true,
};

export function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

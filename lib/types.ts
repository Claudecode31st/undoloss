// ─── Core position ────────────────────────────────────────────────────────────
export interface Position {
  id: string;
  symbol: string;
  coinGeckoId: string;
  direction: 'long' | 'short';
  size: number;          // e.g. 0.417 (BTC), 160 (SOL)
  entryPrice: number;    // from exchange
  currentPrice: number;  // updated from CoinGecko or manually
  leverage: number;      // e.g. 100
  color: string;
}

// ─── Account ──────────────────────────────────────────────────────────────────
export interface Account {
  walletBalance: number;    // Bybit "Wallet Balance"
  availableBalance: number; // Bybit "Available Balance"
}

// ─── Portfolio (persisted) ────────────────────────────────────────────────────
export interface Portfolio {
  positions: Position[];
  account: Account;
  lastUpdated: string;
}

// ─── P&L for a single position ────────────────────────────────────────────────
export interface PosPnL {
  id: string;
  unrealizedPnL: number;   // USD
  pnlPercent: number;      // % price move from entry (direction-adjusted)
  roiPct: number;          // unrealizedPnL / initialMargin × 100
  initialMargin: number;   // entryPrice × size / leverage
  positionValue: number;   // currentPrice × size
  costBasis: number;       // entryPrice × size
}

// ─── Paired long + short analysis ────────────────────────────────────────────
export interface PairInfo {
  symbol: string;
  color: string;
  coinGeckoId: string;
  long: Position;
  short: Position;
  longPnL: PosPnL;
  shortPnL: PosPnL;
  /** CONSTANT regardless of price: size × (shortEntry − longEntry) */
  lockedLoss: number;
  /** % the long needs to RISE to reach its entry (break-even) */
  longPctToBreakEven: number;
  /** % the short needs to DROP to reach its entry (break-even), expressed as positive number */
  shortPctToBreakEven: number;
}

// ─── Strategy ─────────────────────────────────────────────────────────────────
export type StrategyId = 'bear' | 'bull' | 'exit';

export interface PriceTarget {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  pctMove: number;   // positive = needs to rise, negative = needs to drop
}

export interface Strategy {
  id: StrategyId;
  name: string;
  emoji: string;
  tagline: string;
  /** How much you lock in right now by closing selected legs (negative) */
  immediateRealizedLoss: number;
  /** Current unrealized on the legs you KEEP */
  remainingCurrentPnL: number;
  /** Equity after close + if remaining legs reach their entries (best case) */
  bestCaseEquity: number;
  /** Equity after close + if remaining legs hit their entries */
  targets: PriceTarget[];
  feasibility: 1 | 2 | 3 | 4 | 5;
  isRecommended: boolean;
  steps: string[];
  risk: string;
  upside: string;
}

// ─── Simulator ────────────────────────────────────────────────────────────────
export interface SimResult {
  symbol: string;
  longPnL: number;
  shortPnL: number;
  pairPnL: number;
}

// ─── OHLCCandle (for chart util) ──────────────────────────────────────────────
export interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ─── Supported coins ──────────────────────────────────────────────────────────
export const SUPPORTED_COINS = [
  { symbol: 'BTC',  name: 'Bitcoin',    coinGeckoId: 'bitcoin',      color: '#f97316' },
  { symbol: 'ETH',  name: 'Ethereum',   coinGeckoId: 'ethereum',     color: '#6366f1' },
  { symbol: 'SOL',  name: 'Solana',     coinGeckoId: 'solana',       color: '#22c55e' },
  { symbol: 'BNB',  name: 'BNB',        coinGeckoId: 'binancecoin',  color: '#eab308' },
  { symbol: 'XRP',  name: 'XRP',        coinGeckoId: 'ripple',       color: '#0ea5e9' },
  { symbol: 'ADA',  name: 'Cardano',    coinGeckoId: 'cardano',      color: '#3b82f6' },
  { symbol: 'AVAX', name: 'Avalanche',  coinGeckoId: 'avalanche-2',  color: '#ef4444' },
  { symbol: 'DOGE', name: 'Dogecoin',   coinGeckoId: 'dogecoin',     color: '#ca8a04' },
  { symbol: 'LINK', name: 'Chainlink',  coinGeckoId: 'chainlink',    color: '#06b6d4' },
];

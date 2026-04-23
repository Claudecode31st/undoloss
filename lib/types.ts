export type StrategyMode = 'dca' | 'breakeven' | 'risk-reduction' | 'swing' | 'delta-neutral';
export type RiskMode = 'conservative' | 'balanced' | 'aggressive';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  coinGeckoId: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  color: string;
  change24h?: number;
}

export interface Portfolio {
  assets: CryptoAsset[];
  strategy: StrategyMode;
  riskMode: RiskMode;
  hedgeRatio: number;
  lastUpdated: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  avgEntryPrice: number;
  breakevenValue: number;
  change24h: number;
}

export interface AssetPnL {
  assetId: string;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  marketValue: number;
  costBasis: number;
}

export interface RiskScore {
  score: number;
  level: string;
  drawdownScore: number;
  concentrationScore: number;
  exposureScore: number;
  concentrationRisk: 'Low' | 'Moderate' | 'High';
  top2AssetsPercent: number;
}

export interface AllocationItem {
  symbol: string;
  name: string;
  percent: number;
  color: string;
  value: number;
}

export interface DCAStage {
  stage: number;
  priceTarget: number;
  percentFromCurrent: number;
  label: string;
}

export interface RecommendedAction {
  order: number;
  title: string;
  description: string;
  type: 'hold' | 'dca' | 'hedge' | 'reduce' | 'reassess';
}

export interface StrategyResult {
  mode: StrategyMode;
  name: string;
  description: string;
  netExposureLabel: string;
  netExposurePercent: number;
  hedgeStatus: string;
  longValue: number;
  hedgeValue: number;
  freezeZoneActive: boolean;
  actions: RecommendedAction[];
  dcaStages?: DCAStage[];
}

export interface ScenarioOutcome {
  scenario: 'bull' | 'sideways' | 'bear';
  name: string;
  returnRangeLow: number;
  returnRangeHigh: number;
  recoveryTimeLow: string;
  recoveryTimeHigh: string;
  difficulty: 'Good' | 'Moderate' | 'Challenging';
  color: string;
  badgeColor: string;
  icon: string;
}

export interface BehavioralWarning {
  type: 'panic-selling' | 'overtrading' | 'over-averaging';
  name: string;
  level: 'Low' | 'Moderate' | 'High';
  color: string;
  icon: string;
}

export interface HedgeStatus {
  ratio: number;
  longValue: number;
  hedgeValue: number;
  netExposurePercent: number;
  netExposureLabel: string;
  freezeZoneActive: boolean;
}

export const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin', color: '#f97316' },
  { symbol: 'ETH', name: 'Ethereum', coinGeckoId: 'ethereum', color: '#6366f1' },
  { symbol: 'SOL', name: 'Solana', coinGeckoId: 'solana', color: '#22c55e' },
  { symbol: 'BNB', name: 'BNB', coinGeckoId: 'binancecoin', color: '#eab308' },
  { symbol: 'ADA', name: 'Cardano', coinGeckoId: 'cardano', color: '#3b82f6' },
  { symbol: 'AVAX', name: 'Avalanche', coinGeckoId: 'avalanche-2', color: '#ef4444' },
  { symbol: 'DOT', name: 'Polkadot', coinGeckoId: 'polkadot', color: '#ec4899' },
  { symbol: 'MATIC', name: 'Polygon', coinGeckoId: 'matic-network', color: '#8b5cf6' },
  { symbol: 'LINK', name: 'Chainlink', coinGeckoId: 'chainlink', color: '#06b6d4' },
  { symbol: 'DOGE', name: 'Dogecoin', coinGeckoId: 'dogecoin', color: '#ca8a04' },
  { symbol: 'XRP', name: 'XRP', coinGeckoId: 'ripple', color: '#0ea5e9' },
  { symbol: 'LTC', name: 'Litecoin', coinGeckoId: 'litecoin', color: '#94a3b8' },
];

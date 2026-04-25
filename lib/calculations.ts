import { CryptoAsset, PortfolioStats, AllocationItem, RiskScore, AssetPnL, HedgeStatus } from './types';

export function calcAssetPnL(asset: CryptoAsset): AssetPnL {
  const costBasis = asset.entryPrice * asset.amount;
  const isShort = asset.direction === 'short';

  if (isShort) {
    // Short profits when price goes down
    const unrealizedPnL = (asset.entryPrice - asset.currentPrice) * asset.amount;
    const unrealizedPnLPercent = asset.entryPrice === 0 ? 0
      : ((asset.entryPrice - asset.currentPrice) / asset.entryPrice) * 100;
    // Market value of short = margin + floating P&L (position grows when price drops)
    const marketValue = costBasis + unrealizedPnL;
    return { assetId: asset.id, unrealizedPnL, unrealizedPnLPercent, marketValue, costBasis };
  }

  const marketValue = asset.currentPrice * asset.amount;
  const unrealizedPnL = marketValue - costBasis;
  const unrealizedPnLPercent = costBasis === 0 ? 0
    : ((asset.currentPrice - asset.entryPrice) / asset.entryPrice) * 100;
  return { assetId: asset.id, unrealizedPnL, unrealizedPnLPercent, marketValue, costBasis };
}

export function calcPortfolioStats(assets: CryptoAsset[]): PortfolioStats {
  if (assets.length === 0) {
    return { totalValue: 0, totalInvested: 0, totalUnrealizedPnL: 0, totalUnrealizedPnLPercent: 0, avgEntryPrice: 0, breakevenValue: 0, change24h: 0 };
  }

  let totalValue = 0;
  let totalInvested = 0;
  let totalChange24h = 0;

  for (const asset of assets) {
    const pnl = calcAssetPnL(asset);
    totalValue += pnl.marketValue;
    totalInvested += asset.entryPrice * asset.amount;
    if (asset.change24h) {
      // For shorts, 24h change in asset price = opposite direction for the position
      const sign = asset.direction === 'short' ? -1 : 1;
      totalChange24h += sign * (asset.currentPrice * asset.amount * asset.change24h) / 100;
    }
  }

  const totalUnrealizedPnL = totalValue - totalInvested;
  const totalUnrealizedPnLPercent = totalInvested === 0 ? 0 : ((totalValue - totalInvested) / totalInvested) * 100;
  const totalAmount = assets.reduce((sum, a) => sum + a.amount, 0);
  const avgEntryPrice = totalAmount === 0 ? 0 : totalInvested / totalAmount;
  const change24h = totalInvested === 0 ? 0 : (totalChange24h / totalInvested) * 100;

  return { totalValue, totalInvested, totalUnrealizedPnL, totalUnrealizedPnLPercent, avgEntryPrice, breakevenValue: totalInvested, change24h };
}

export function calcAllocation(assets: CryptoAsset[]): AllocationItem[] {
  const totalInvested = assets.reduce((sum, a) => sum + a.entryPrice * a.amount, 0);
  if (totalInvested === 0) return [];

  const items = assets.map((asset) => ({
    symbol: asset.symbol,
    name: asset.name,
    percent: ((asset.entryPrice * asset.amount) / totalInvested) * 100,
    color: asset.color,
    value: asset.entryPrice * asset.amount,
  }));

  items.sort((a, b) => b.percent - a.percent);

  // Group small allocations as "Others"
  const threshold = 2;
  const main = items.filter((i) => i.percent >= threshold);
  const others = items.filter((i) => i.percent < threshold);

  if (others.length > 0) {
    const othersPercent = others.reduce((sum, i) => sum + i.percent, 0);
    const othersValue = others.reduce((sum, i) => sum + i.value, 0);
    main.push({ symbol: 'Others', name: 'Others', percent: othersPercent, color: '#71717a', value: othersValue });
  }

  return main;
}

export function calcRiskScore(assets: CryptoAsset[]): RiskScore {
  if (assets.length === 0) {
    return { score: 0, level: 'Low Risk', drawdownScore: 0, leverageScore: 0, liquidationScore: 0, leveragedPortfolioPct: 0, closestLiqDistPct: null, maxLeverage: 0 };
  }

  const stats = calcPortfolioStats(assets);
  const totalValue = stats.totalValue || 1;

  // 1. Drawdown (0–40 pts): how far underwater the portfolio is
  const drawdownPercent = Math.abs(Math.min(stats.totalUnrealizedPnLPercent, 0));
  const drawdownScore = Math.min(40, (drawdownPercent / 50) * 40);

  // 2. Leverage exposure (0–35 pts): % of portfolio value in leveraged positions
  const leveragedValue = assets
    .filter(a => (a.leverage ?? 1) > 1)
    .reduce((sum, a) => sum + calcAssetPnL(a).marketValue, 0);
  const leveragedPortfolioPct = (leveragedValue / totalValue) * 100;
  const maxLeverage = assets.reduce((max, a) => Math.max(max, a.leverage ?? 1), 0);
  // Score scales with both how much is leveraged and how high the leverage is
  const leverageScore = Math.min(35, (leveragedPortfolioPct / 100) * 20 + Math.min(15, (maxLeverage - 1) * 1.5));

  // 3. Liquidation proximity (0–25 pts): how close the nearest margin call is
  let closestLiqDistPct: number | null = null;
  for (const asset of assets) {
    const liqPrice = calcMarginCallPrice(asset);
    if (liqPrice && asset.currentPrice > 0) {
      const isLong = (asset.direction ?? 'long') === 'long';
      // For longs: how far current price is above liq (negative means already liquidated)
      // For shorts: how far current price is below liq
      const dist = isLong
        ? ((asset.currentPrice - liqPrice) / asset.currentPrice) * 100
        : ((liqPrice - asset.currentPrice) / asset.currentPrice) * 100;
      if (closestLiqDistPct === null || dist < closestLiqDistPct) {
        closestLiqDistPct = dist;
      }
    }
  }
  // Closer to liq = higher score. <10% away = max, >50% away = 0
  const liquidationScore = closestLiqDistPct === null ? 0
    : closestLiqDistPct <= 0 ? 25
    : closestLiqDistPct < 10 ? 25
    : closestLiqDistPct < 20 ? 18
    : closestLiqDistPct < 35 ? 10
    : closestLiqDistPct < 50 ? 4
    : 0;

  const score = Math.min(100, Math.round(drawdownScore + leverageScore + liquidationScore));

  let level: string;
  if (score < 30) level = 'Low Risk';
  else if (score < 50) level = 'Moderate Risk';
  else if (score < 70) level = 'Moderate-High Risk';
  else level = 'High Risk';

  return { score, level, drawdownScore, leverageScore, liquidationScore, leveragedPortfolioPct, closestLiqDistPct, maxLeverage };
}

export function calcHedge(assets: CryptoAsset[], hedgeRatio: number): HedgeStatus {
  const totalValue = assets.reduce((sum, a) => sum + a.currentPrice * a.amount, 0);
  const hedgeValue = totalValue * (hedgeRatio / 100);
  const longValue = totalValue;
  const netExposurePercent = hedgeRatio === 0 ? 100 : Math.max(0, 100 - hedgeRatio * 2);

  let netExposureLabel: string;
  if (hedgeRatio === 0) netExposureLabel = 'Long';
  else if (hedgeRatio < 30) netExposureLabel = 'Slightly Reduced';
  else if (hedgeRatio < 60) netExposureLabel = 'Neutral';
  else netExposureLabel = 'Reduced';

  return {
    ratio: hedgeRatio,
    longValue,
    hedgeValue,
    netExposurePercent,
    netExposureLabel,
    freezeZoneActive: hedgeRatio >= 50,
  };
}

export function calcBreakevenMove(asset: CryptoAsset): number {
  if (asset.currentPrice === 0) return 0;
  const isShort = asset.direction === 'short';
  if (isShort) {
    // Short: price needs to DROP back to entry to break even
    // Positive = losing (price above entry), negative = in profit
    return ((asset.currentPrice - asset.entryPrice) / asset.currentPrice) * 100;
  }
  // Long: price needs to RISE back to entry to break even
  return ((asset.entryPrice - asset.currentPrice) / asset.currentPrice) * 100;
}

export function calcBreakevenPortfolio(assets: CryptoAsset[]): number {
  const stats = calcPortfolioStats(assets);
  if (stats.totalValue === 0) return 0;
  return ((stats.breakevenValue - stats.totalValue) / stats.totalValue) * 100;
}

/** Approximate isolated-margin liquidation price. Returns null if leverage ≤ 1. */
export function calcMarginCallPrice(asset: CryptoAsset): number | null {
  const lev = asset.leverage ?? 1;
  if (lev <= 1) return null;
  const isShort = asset.direction === 'short';
  if (isShort) {
    // Liquidated when price rises (lev-1)/lev above entry
    return asset.entryPrice * (lev + 1) / lev;
  }
  // Liquidated when price falls (lev-1)/lev below entry
  return asset.entryPrice * (lev - 1) / lev;
}

export function fmtCurrency(value: number, decimals = 2): string {
  if (Math.abs(value) >= 1_000_000) {
    return '$' + (value / 1_000_000).toFixed(2) + 'M';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function fmtPercent(value: number, showPlus = true): string {
  const prefix = value > 0 && showPlus ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function fmtNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

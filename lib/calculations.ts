import { Position, PosPnL, PairInfo, Strategy, SimResult, Account } from './types';

// ─── Single-position P&L ──────────────────────────────────────────────────────
export function calcPosPnL(pos: Position): PosPnL {
  const costBasis     = pos.entryPrice * pos.size;
  const initialMargin = costBasis / Math.max(1, pos.leverage);
  const positionValue = pos.currentPrice * pos.size;

  const unrealizedPnL = pos.direction === 'long'
    ? (pos.currentPrice - pos.entryPrice) * pos.size
    : (pos.entryPrice  - pos.currentPrice) * pos.size;

  const pnlPercent = pos.entryPrice === 0 ? 0
    : pos.direction === 'long'
      ? ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100
      : ((pos.entryPrice  - pos.currentPrice) / pos.entryPrice) * 100;

  const roiPct = initialMargin > 0 ? (unrealizedPnL / initialMargin) * 100 : 0;

  return { id: pos.id, unrealizedPnL, pnlPercent, roiPct, initialMargin, positionValue, costBasis };
}

// ─── Pair analysis ────────────────────────────────────────────────────────────
/**
 * Groups a long + short of the same asset.
 *
 * Key insight: for a perfect delta-neutral pair (same size, same asset),
 *   combinedPnL = size × (shortEntry − longEntry)  ← CONSTANT regardless of price
 *
 * No price move will improve the pair's combined P&L. To recover, you MUST
 * break the hedge by closing one leg and letting the other run directionally.
 */
export function calcPairInfo(long: Position, short: Position): PairInfo {
  const longPnL  = calcPosPnL(long);
  const shortPnL = calcPosPnL(short);

  // Locked loss — mathematically constant (see formula above)
  const lockedLoss = long.size * (short.entryPrice - long.entryPrice);

  // % the long needs to RISE from current to reach its entry (break-even)
  const longPctToBreakEven = long.currentPrice > 0
    ? ((long.entryPrice - long.currentPrice) / long.currentPrice) * 100
    : 0;

  // % the short needs to DROP from current to reach its entry (break-even)
  const shortPctToBreakEven = short.currentPrice > 0
    ? ((short.currentPrice - short.entryPrice) / short.currentPrice) * 100
    : 0;

  return {
    symbol: long.symbol,
    color:  long.color,
    coinGeckoId: long.coinGeckoId,
    long,
    short,
    longPnL,
    shortPnL,
    lockedLoss,
    longPctToBreakEven,
    shortPctToBreakEven,
  };
}

// ─── Account equity ───────────────────────────────────────────────────────────
export function calcEquity(account: Account, positions: Position[]): {
  equity: number;
  totalUnrealizedPnL: number;
  totalMarginUsed: number;
} {
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + calcPosPnL(p).unrealizedPnL, 0);
  const equity             = account.walletBalance + totalUnrealizedPnL;
  const totalMarginUsed    = positions.reduce(
    (sum, p) => sum + (p.entryPrice * p.size) / Math.max(1, p.leverage), 0,
  );
  return { equity, totalUnrealizedPnL, totalMarginUsed };
}

// ─── Recovery strategies ──────────────────────────────────────────────────────
/**
 * Generates the three canonical recovery strategies for a delta-neutral drawdown.
 *
 * Bear Play  — close longs, hold shorts (shorts need price to DROP ~9–19%)
 * Bull Play  — close shorts, hold longs (longs need price to RISE ~54–151%)
 * Full Exit  — close everything, rebuild from remaining equity
 */
export function calcStrategies(pairs: PairInfo[], account: Account): Strategy[] {
  const walletBalance = account.walletBalance;

  // Aggregate current PnL by side
  const totalLongPnL  = pairs.reduce((s, p) => s + p.longPnL.unrealizedPnL,  0);
  const totalShortPnL = pairs.reduce((s, p) => s + p.shortPnL.unrealizedPnL, 0);
  const totalPnL      = totalLongPnL + totalShortPnL;

  // ── Bear Play: close longs now, hold shorts ────────────────────────────────
  // After closing longs: wallet drops by |totalLongPnL| (already negative)
  // Remaining unrealized = totalShortPnL (also negative)
  // Best case (shorts reach 0): equity = wallet + totalLongPnL + 0
  const bearBestCaseEquity = walletBalance + totalLongPnL; // shorts at break-even → 0

  const bearFeasMax = Math.max(...pairs.map(p => p.shortPctToBreakEven));
  const bearFeasibility = (
    bearFeasMax < 10 ? 5 :
    bearFeasMax < 20 ? 4 :
    bearFeasMax < 35 ? 3 :
    bearFeasMax < 55 ? 2 : 1
  ) as 1 | 2 | 3 | 4 | 5;

  const bear: Strategy = {
    id: 'bear',
    name: 'Close Longs — Hold Shorts',
    emoji: '🐻',
    tagline: 'Bet on a price drop to recover via your short legs',
    immediateRealizedLoss: totalLongPnL,
    remainingCurrentPnL:   totalShortPnL,
    bestCaseEquity: bearBestCaseEquity,
    feasibility: bearFeasibility,
    isRecommended: true,
    targets: pairs.map(p => ({
      symbol:       p.symbol,
      side:         'short' as const,
      entryPrice:   p.short.entryPrice,
      currentPrice: p.short.currentPrice,
      pctMove:      -p.shortPctToBreakEven, // negative = drop needed
    })),
    steps: [
      ...pairs.map(p =>
        `Market-close ${p.symbol} Long (${p.long.size} @ $${p.long.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}) — lock in ${fmtUSD(p.longPnL.unrealizedPnL)}`
      ),
      'Keep all Short positions open',
      ...pairs.map(p =>
        `Set price alert at $${p.short.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 3 })} for ${p.symbol} — that is your short break-even`
      ),
      'When short legs turn profitable, close them with a limit order',
    ],
    risk:   'If prices pump hard, your shorts lose more. Set stop-losses above short entries.',
    upside: `Shorts profit on any significant decline. SOL needs only ${pairs.find(p=>p.symbol==='SOL')?.shortPctToBreakEven.toFixed(1) ?? '?'}% drop to break even.`,
  };

  // ── Bull Play: close shorts now, hold longs ────────────────────────────────
  const bullBestCaseEquity = walletBalance + totalShortPnL; // longs at break-even → 0

  const bullFeasMax = Math.max(...pairs.map(p => p.longPctToBreakEven));
  const bullFeasibility = (
    bullFeasMax < 10 ? 5 :
    bullFeasMax < 25 ? 4 :
    bullFeasMax < 50 ? 3 :
    bullFeasMax < 80 ? 2 : 1
  ) as 1 | 2 | 3 | 4 | 5;

  const bull: Strategy = {
    id: 'bull',
    name: 'Close Shorts — Hold Longs',
    emoji: '🐂',
    tagline: 'Bet on a price recovery to rebuild via your long legs',
    immediateRealizedLoss: totalShortPnL,
    remainingCurrentPnL:   totalLongPnL,
    bestCaseEquity: bullBestCaseEquity,
    feasibility: bullFeasibility,
    isRecommended: false,
    targets: pairs.map(p => ({
      symbol:       p.symbol,
      side:         'long' as const,
      entryPrice:   p.long.entryPrice,
      currentPrice: p.long.currentPrice,
      pctMove:      p.longPctToBreakEven, // positive = rise needed
    })),
    steps: [
      ...pairs.map(p =>
        `Market-close ${p.symbol} Short (${p.short.size} @ $${p.short.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}) — lock in ${fmtUSD(p.shortPnL.unrealizedPnL)}`
      ),
      'Keep all Long positions open',
      ...pairs.map(p =>
        `Set price alert at $${p.long.entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} for ${p.symbol} — that is your long break-even`
      ),
      'Close longs in stages as they approach entry price',
    ],
    risk:   `Requires massive price recoveries (BTC +54%, SOL +151%). Unlikely in near term. If market dumps further, equity → 0.`,
    upside: `If the bull market returns to ATH levels, long legs recover most of the losses.`,
  };

  // ── Full Exit: close everything ───────────────────────────────────────────
  const exitEquity = walletBalance + totalPnL; // realise all PnL
  const exit: Strategy = {
    id: 'exit',
    name: 'Close Everything — Rebuild',
    emoji: '🔄',
    tagline: 'Accept the full loss, start fresh with proper risk sizing',
    immediateRealizedLoss: totalPnL,
    remainingCurrentPnL:   0,
    bestCaseEquity: exitEquity,
    feasibility: 3,
    isRecommended: false,
    targets: [],
    steps: [
      'Close all 4 positions (2 BTC, 2 SOL) simultaneously',
      `Accept total realised loss of ${fmtUSD(totalPnL)}`,
      `Remaining equity to rebuild with: ≈${fmtUSD(exitEquity)}`,
      'Use max 2–3× leverage going forward',
      'Risk no more than 1–2% of equity per trade ($40–$80)',
      'Never DCA without a pre-defined plan and size cap',
    ],
    risk:   'You permanently lock in the full loss with no chance of partial recovery.',
    upside: 'Clean slate. Smaller account is easier to manage. No liquidation risk.',
  };

  return [bear, bull, exit];
}

// ─── Simulator ────────────────────────────────────────────────────────────────
export function calcSimulation(
  pairs: PairInfo[],
  targetPrices: Record<string, number>,
): SimResult[] {
  return pairs.map(p => {
    const tPrice = targetPrices[p.symbol] ?? p.long.currentPrice;

    const longPnL  = (tPrice - p.long.entryPrice)  * p.long.size;
    const shortPnL = (p.short.entryPrice - tPrice)  * p.short.size;
    const pairPnL  = longPnL + shortPnL;

    return { symbol: p.symbol, longPnL, shortPnL, pairPnL };
  });
}

// ─── Cross-margin liquidation price ───────────────────────────────────────────
function maintenanceRate(leverage: number): number {
  return Math.min(0.05, Math.max(0.004, 0.5 / Math.max(1, leverage)));
}

export function calcLiqPrice(pos: Position, allPositions: Position[], walletBalance: number): number | null {
  if (pos.leverage <= 1 || pos.size <= 0 || walletBalance <= 0) return null;
  const isShort = pos.direction === 'short';

  const otherPnL = allPositions
    .filter(p => p.id !== pos.id && p.leverage > 1)
    .reduce((sum, p) => sum + calcPosPnL(p).unrealizedPnL, 0);

  const totalMM = allPositions
    .filter(p => p.leverage > 1)
    .reduce((sum, p) => sum + p.entryPrice * p.size * maintenanceRate(p.leverage), 0);

  const buffer = walletBalance + otherPnL - totalMM;

  const liqPrice = isShort
    ? pos.entryPrice + buffer / pos.size
    : pos.entryPrice - buffer / pos.size;

  return liqPrice > 0 ? liqPrice : 0;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmtUSD(value: number, decimals = 0): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return (value < 0 ? '-' : '') + '$' + (abs / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return (value < 0 ? '-' : '') + '$' + (abs / 1_000).toFixed(1) + 'k';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtUSDFull(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtPct(value: number, showPlus = true): string {
  const prefix = value > 0 && showPlus ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

export function fmtNum(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
}

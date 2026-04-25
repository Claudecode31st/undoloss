/**
 * Technical indicators — pure functions, no side effects.
 *
 * TSI (True Strength Index) — William Blau
 *   Formula: 100 × EMA(EMA(PC, long), short) / EMA(EMA(|PC|, long), short)
 *   where PC = daily price change (close[i] − close[i−1])
 *   Signal line = EMA(TSI, signalPeriod)
 *
 * ATR (Average True Range) — Wilder smoothing
 *   TR[i] = max(H−L, |H−prevC|, |L−prevC|)
 *   ATR[i] = (ATR[i−1] × (period−1) + TR[i]) / period
 *
 * EMA seed: SMA of the first `period` values for numerical stability.
 */

import { OHLCCandle } from './types';

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Standard EMA seeded with SMA of the first `period` values. */
function ema(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  if (values.length < period) return out;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  out[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

/** Strip leading NaN values and return the valid tail, preserving ordering. */
function validTail(arr: number[]): number[] {
  let start = 0;
  while (start < arr.length && isNaN(arr[start])) start++;
  return arr.slice(start);
}

// ─── TSI ─────────────────────────────────────────────────────────────────────

export interface TSIResult {
  latestTSI: number;
  latestSignal: number;
  /** True if TSI crossed above signal line within the last 3 bars */
  recentCrossUp: boolean;
  /** True if TSI crossed below signal line within the last 3 bars */
  recentCrossDown: boolean;
  /** True if TSI dipped below −25 within the last 10 bars (confirms oversold) */
  wasOversold: boolean;
  /** Last ≤30 paired (tsi, signal) values for the sparkline */
  sparkline: Array<{ tsi: number; signal: number }>;
}

export function calcTSI(
  closes: number[],
  longPeriod = 25,
  shortPeriod = 13,
  signalPeriod = 7,
): TSIResult | null {
  // Minimum candles needed before any valid output exists:
  // longPeriod − 1 (first EMA seed) + shortPeriod − 1 (second EMA seed) + signalPeriod − 1 (signal seed) + a few extra
  const minNeeded = longPeriod + shortPeriod + signalPeriod + 5;
  if (closes.length < minNeeded) return null;

  // Price changes — index 0 is defined as 0 (no prior bar)
  const pc: number[] = [0];
  const apc: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    pc.push(d);
    apc.push(Math.abs(d));
  }

  // First EMA pass
  const e1pc  = ema(pc,  longPeriod);
  const e1apc = ema(apc, longPeriod);

  // Second EMA pass on the valid portion only
  const e2pc  = ema(validTail(e1pc),  shortPeriod);
  const e2apc = ema(validTail(e1apc), shortPeriod);

  // TSI values (skip NaN-seeded prefix)
  const tsiRaw: number[] = [];
  for (let i = 0; i < e2pc.length; i++) {
    if (isNaN(e2pc[i]) || isNaN(e2apc[i]) || e2apc[i] === 0) continue;
    tsiRaw.push(100 * e2pc[i] / e2apc[i]);
  }

  if (tsiRaw.length < signalPeriod + 5) return null;

  // Signal line
  const sigRaw = ema(tsiRaw, signalPeriod);

  // Paired valid values (both TSI and signal must be non-NaN)
  const pairs: Array<{ tsi: number; signal: number }> = [];
  for (let i = 0; i < tsiRaw.length; i++) {
    if (!isNaN(sigRaw[i])) pairs.push({ tsi: tsiRaw[i], signal: sigRaw[i] });
  }
  if (pairs.length < 4) return null;

  const n = pairs.length;
  const last  = pairs[n - 1];
  const prev  = pairs[n - 2];
  const prev2 = pairs[n - 3];

  // Bullish cross: TSI moves from below to above signal
  const recentCrossUp =
    (last.tsi > last.signal && prev.tsi  <= prev.signal) ||
    (prev.tsi > prev.signal && prev2.tsi <= prev2.signal);

  // Bearish cross: TSI moves from above to below signal
  const recentCrossDown =
    (last.tsi < last.signal && prev.tsi  >= prev.signal) ||
    (prev.tsi < prev.signal && prev2.tsi >= prev2.signal);

  // Oversold check: any of the last 10 bars (excluding current) had TSI < −25
  const lookback = Math.min(10, n - 1);
  let wasOversold = false;
  for (let i = n - 1 - lookback; i < n - 1; i++) {
    if (pairs[i].tsi < -25) { wasOversold = true; break; }
  }

  return {
    latestTSI:     last.tsi,
    latestSignal:  last.signal,
    recentCrossUp,
    recentCrossDown,
    wasOversold,
    sparkline: pairs.slice(-30),
  };
}

// ─── ATR ─────────────────────────────────────────────────────────────────────

export interface ATRResult {
  latestATR: number;
  /** latestATR ÷ average of the last 20 ATR values (1.0 = flat, >1.2 = elevated) */
  atrRatio: number;
}

export function calcATR(candles: OHLCCandle[], period = 14): ATRResult | null {
  if (candles.length < period + 2) return null;

  // True range
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const pc = candles[i - 1].close;
    tr.push(Math.max(high - low, Math.abs(high - pc), Math.abs(low - pc)));
  }

  if (tr.length < period) return null;

  // Wilder smoothing: seed = SMA of first `period` TRs
  const atrArr: number[] = new Array(tr.length).fill(NaN);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += tr[i];
  atrArr[period - 1] = seed / period;

  for (let i = period; i < tr.length; i++) {
    atrArr[i] = (atrArr[i - 1] * (period - 1) + tr[i]) / period;
  }

  const valid = atrArr.filter(v => !isNaN(v));
  if (valid.length === 0) return null;

  const latestATR = valid[valid.length - 1];
  const recent    = valid.slice(-20);
  const avgATR    = recent.reduce((s, v) => s + v, 0) / recent.length;

  return {
    latestATR,
    atrRatio: avgATR > 0 ? latestATR / avgATR : 1,
  };
}

// ─── RSI ─────────────────────────────────────────────────────────────────────

export interface RSIResult {
  value: number;          // 0–100
  signal: 'overbought' | 'neutral' | 'oversold';
  /** True if RSI crossed above 30 within last 3 bars (bullish signal from oversold) */
  crossAbove30: boolean;
  /** True if RSI crossed below 70 within last 3 bars (bearish signal from overbought) */
  crossBelow70: boolean;
  /** Last ≤30 RSI values for sparkline */
  sparkline: number[];
}

export function calcRSI(candles: OHLCCandle[], period = 14): RSIResult | null {
  if (candles.length < period + 5) return null;
  const closes = candles.map(c => c.close);

  // Calculate price changes
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  // Wilder smoothing: seed with SMA of first `period` values
  let avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;

  const rsiArr: number[] = [];
  const rs0 = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  rsiArr.push(rs0);

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    rsiArr.push(rs);
  }

  if (rsiArr.length < 4) return null;

  const n = rsiArr.length;
  const value = rsiArr[n - 1];
  const prev  = rsiArr[n - 2];
  const prev2 = rsiArr[n - 3];

  const crossAbove30 =
    (value >= 30 && prev  < 30) ||
    (prev  >= 30 && prev2 < 30);
  const crossBelow70 =
    (value <= 70 && prev  > 70) ||
    (prev  <= 70 && prev2 > 70);

  const signal: RSIResult['signal'] =
    value >= 70 ? 'overbought' :
    value <= 30 ? 'oversold'   : 'neutral';

  return {
    value,
    signal,
    crossAbove30,
    crossBelow70,
    sparkline: rsiArr.slice(-30),
  };
}

// ─── 50-day & 200-day SMA ────────────────────────────────────────────────────

export interface MAResult {
  ema20: number | null;
  sma50: number | null;
  sma200: number | null;
  priceVsEma20: 'above' | 'below';
  priceVsSma50: 'above' | 'below';
  priceVsSma200: 'above' | 'below';
  trend: 'strong-up' | 'up' | 'mixed' | 'down' | 'strong-down';
}

export function calcMAs(candles: OHLCCandle[]): MAResult | null {
  if (candles.length < 20) return null;
  const closes = candles.map(c => c.close);
  const price  = closes[closes.length - 1];

  // EMA20
  const ema20Arr = ema(closes, 20);
  const ema20Val = ema20Arr[ema20Arr.length - 1];
  const ema20    = isNaN(ema20Val) ? null : ema20Val;

  // SMA50
  let sma50: number | null = null;
  if (closes.length >= 50) {
    const sum = closes.slice(-50).reduce((s, v) => s + v, 0);
    sma50 = sum / 50;
  }

  // SMA200
  let sma200: number | null = null;
  if (closes.length >= 200) {
    const sum = closes.slice(-200).reduce((s, v) => s + v, 0);
    sma200 = sum / 200;
  }

  const above20  = ema20  ? price > ema20  : false;
  const above50  = sma50  ? price > sma50  : false;
  const above200 = sma200 ? price > sma200 : false;

  const aboveCount = [above20, above50, above200].filter(Boolean).length;
  const trend: MAResult['trend'] =
    aboveCount === 3 ? 'strong-up' :
    aboveCount === 2 ? 'up' :
    aboveCount === 1 ? 'mixed' :
    sma200 && ema20 && !above20 && !above50 && !above200 ? 'strong-down' :
    'down';

  return {
    ema20,
    sma50,
    sma200,
    priceVsEma20:  above20  ? 'above' : 'below',
    priceVsSma50:  above50  ? 'above' : 'below',
    priceVsSma200: above200 ? 'above' : 'below',
    trend,
  };
}

// ─── 20-day EMA ──────────────────────────────────────────────────────────────

export interface EMA20Result {
  value: number;
  priceAbove: boolean;
}

export function calcEMA20(candles: OHLCCandle[]): EMA20Result | null {
  if (candles.length < 20) return null;
  const closes = candles.map(c => c.close);
  const line   = ema(closes, 20);
  const latest = line[line.length - 1];
  if (isNaN(latest)) return null;
  return { value: latest, priceAbove: closes[closes.length - 1] > latest };
}

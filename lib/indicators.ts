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

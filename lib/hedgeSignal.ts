/**
 * Hedge signal engine — combines TSI, ATR, and 20-day EMA into a
 * single actionable signal for each hedged position pair.
 *
 * UNLOCK  — reduce or close the short hedge, let the long run
 * WATCH   — momentum building but not all conditions confirmed yet
 * HOLD    — stay hedged, no clear directional edge
 * RELOCK  — re-establish or tighten hedge, risk increasing
 *
 * Four unlock conditions (all must hold for High confidence):
 *   1. TSI crossed above its signal line (fresh bullish momentum)
 *   2. TSI came from below −25 recently (genuine oversold recovery)
 *   3. ATR not spiking — ratio < 1.2 (low turbulence)
 *   4. Price closed above the 20-day EMA (trend shifting up)
 *
 * RELOCK overrides any unlock if ANY of:
 *   - ATR ratio ≥ 1.5 (volatility spike)
 *   - TSI crossed below signal line recently
 *   - Price below 20 EMA AND TSI < 0
 */

import { OHLCCandle, HedgeSignalResult } from './types';
import { calcTSI, calcATR, calcEMA20 } from './indicators';

export function calcHedgeSignal(
  candles: OHLCCandle[],
  longPeriod  = 25,
  shortPeriod = 13,
  signalPeriod = 7,
): HedgeSignalResult {
  const INSUFFICIENT: HedgeSignalResult = {
    signal: 'HOLD',
    confidence: 'Weak',
    latestTSI: 0,
    latestSignalLine: 0,
    atrRatio: 1,
    priceVsEMA: 'unknown',
    wasOversold: false,
    recentCrossUp: false,
    recentCrossDown: false,
    sparkline: [],
    reasons: ['Need at least 90 daily candles for a reliable signal — fetching more data…'],
    conditionsMet: 0,
    dataPoints: candles.length,
    insufficientData: true,
  };

  if (candles.length < 60) return INSUFFICIENT;

  const closes = candles.map(c => c.close);
  const tsi    = calcTSI(closes, longPeriod, shortPeriod, signalPeriod);
  if (!tsi) return INSUFFICIENT;

  const atr   = calcATR(candles);
  const ema20 = calcEMA20(candles);

  const atrRatio   = atr?.atrRatio ?? 1;
  const priceVsEMA = ema20 ? (ema20.priceAbove ? 'above' : 'below') : 'unknown';

  // ── Evaluate each condition ───────────────────────────────────────────────

  const reasons: string[] = [];
  let conditionsMet = 0;

  // 1. TSI above its signal line
  const tsiAboveSignal = tsi.latestTSI > tsi.latestSignal;
  if (tsiAboveSignal) {
    conditionsMet++;
    reasons.push(
      tsi.recentCrossUp
        ? `✓ TSI freshly crossed above signal line (${tsi.latestTSI.toFixed(1)} vs ${tsi.latestSignal.toFixed(1)}) — momentum just turned bullish`
        : `✓ TSI above signal line (${tsi.latestTSI.toFixed(1)} vs ${tsi.latestSignal.toFixed(1)}) — sustained bullish momentum`,
    );
  } else {
    reasons.push(
      `✗ TSI below signal line (${tsi.latestTSI.toFixed(1)} vs ${tsi.latestSignal.toFixed(1)}) — momentum still bearish, stay hedged`,
    );
  }

  // 2. Came from genuine oversold territory (TSI < −25 within last 10 bars)
  if (tsi.wasOversold) {
    conditionsMet++;
    reasons.push('✓ TSI was deeply oversold (<−25) recently — recovery signal has real depth, not just noise');
  } else {
    reasons.push('✗ No recent oversold reading — signal lacks confirmation of a genuine reversal');
  }

  // 3. Volatility calm (ATR ratio < 1.2)
  const atrCalm = atrRatio < 1.2;
  if (atrCalm) {
    conditionsMet++;
    reasons.push(
      `✓ Volatility ${atrRatio < 0.85 ? 'contracting' : 'stable'} (ATR ratio ${atrRatio.toFixed(2)}) — low turbulence, safe to reduce hedge`,
    );
  } else if (atrRatio >= 1.5) {
    reasons.push(`✗ Volatility spike (ATR ratio ${atrRatio.toFixed(2)}) — hedge is protecting you right now`);
  } else {
    reasons.push(`✗ Volatility elevated (ATR ratio ${atrRatio.toFixed(2)}) — wait for it to settle before unlocking`);
  }

  // 4. Price above 20-day EMA
  if (ema20?.priceAbove) {
    conditionsMet++;
    reasons.push(`✓ Price above 20-day EMA ($${ema20.value.toFixed(2)}) — short-term trend has shifted upward`);
  } else if (ema20) {
    reasons.push(`✗ Price below 20-day EMA ($${ema20.value.toFixed(2)}) — trend still down, wait for reclaim`);
  } else {
    reasons.push('✗ Insufficient data for 20-day EMA');
  }

  // ── RELOCK override (takes priority over any unlock signal) ──────────────

  const relockVolatility  = atrRatio >= 1.5;
  const relockMomentum    = tsi.recentCrossDown;
  const relockTrend       = priceVsEMA === 'below' && tsi.latestTSI < 0;
  const relockTrigger     = relockVolatility || relockMomentum || relockTrend;

  // ── Determine final signal ───────────────────────────────────────────────

  let signal:     HedgeSignalResult['signal'];
  let confidence: HedgeSignalResult['confidence'];

  if (relockTrigger) {
    signal     = 'RELOCK';
    confidence = relockVolatility ? 'High' : 'Moderate';
  } else if (tsiAboveSignal && conditionsMet === 4) {
    signal     = 'UNLOCK';
    confidence = 'High';
  } else if (tsiAboveSignal && conditionsMet >= 3) {
    signal     = 'UNLOCK';
    confidence = 'Moderate';
  } else if (tsiAboveSignal && conditionsMet >= 2) {
    signal     = 'WATCH';
    confidence = 'Moderate';
  } else if (tsiAboveSignal) {
    signal     = 'WATCH';
    confidence = 'Weak';
  } else {
    signal     = 'HOLD';
    confidence = conditionsMet === 0 ? 'High' : 'Moderate';
  }

  return {
    signal,
    confidence,
    latestTSI:       tsi.latestTSI,
    latestSignalLine: tsi.latestSignal,
    atrRatio,
    priceVsEMA,
    wasOversold:     tsi.wasOversold,
    recentCrossUp:   tsi.recentCrossUp,
    recentCrossDown: tsi.recentCrossDown,
    sparkline:       tsi.sparkline,
    reasons,
    conditionsMet,
    dataPoints:      candles.length,
    insufficientData: false,
  };
}

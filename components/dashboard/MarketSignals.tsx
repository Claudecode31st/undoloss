'use client';
import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import { PairInfo } from '@/lib/types';
import { fetchOHLC } from '@/lib/coingecko';
import { calcTSI } from '@/lib/indicators';
import { calcRSI, calcMAs } from '@/lib/indicators';
import { OHLCCandle } from '@/lib/types';
import { fmtNum } from '@/lib/calculations';
import { RefreshCw, TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react';

interface AssetSignal {
  symbol: string;
  color: string;
  currentPrice: number;
  tsiValue: number | null;
  tsiSignal: number | null;
  tsiCross: 'bullish' | 'bearish' | 'none';
  tsiSparkline: { tsi: number; signal: number }[];
  rsi: number | null;
  rsiSignal: 'overbought' | 'neutral' | 'oversold' | null;
  rsiCrossAbove30: boolean;
  rsiSparkline: number[];
  trend: string | null;
  ema20: number | null;
  sma50: number | null;
  sma200: number | null;
  /** Recommendation for THIS user's specific exit plan */
  actionSignal: 'close-now' | 'wait' | 'dca-now' | 'dca-watch';
  actionLabel: string;
  actionDetail: string;
  loading: boolean;
  error: string | null;
}

interface Props {
  pairs: PairInfo[];
  /** Which phase we're in: 'sol-exit' = close SOL; 'btc-dca' = DCA BTC */
  phase?: 'sol-exit' | 'btc-dca';
}

function Sparkline({ data, color }: { data: { tsi: number; signal: number }[]; color: string }) {
  if (data.length < 3) return null;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
        <ReferenceLine y={0}   stroke="rgba(100,100,100,0.4)" strokeDasharray="3 3" />
        <ReferenceLine y={-25} stroke="rgba(239,68,68,0.3)"   strokeDasharray="2 3" />
        <ReferenceLine y={25}  stroke="rgba(34,197,94,0.3)"   strokeDasharray="2 3" />
        <Tooltip
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10, padding: '4px 8px' }}
          formatter={(v: unknown) => [(v as number).toFixed(1), '']}
          labelFormatter={() => ''}
        />
        <Line dataKey="tsi"    stroke={color}    dot={false} strokeWidth={1.5} isAnimationActive={false} />
        <Line dataKey="signal" stroke="#f97316"  dot={false} strokeWidth={1}   strokeDasharray="4 2" isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function RSISparkline({ data }: { data: number[] }) {
  if (data.length < 3) return null;
  const chartData = data.map(v => ({ rsi: v }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
        <ReferenceLine y={70} stroke="rgba(239,68,68,0.4)"   strokeDasharray="2 3" />
        <ReferenceLine y={50} stroke="rgba(100,100,100,0.3)" strokeDasharray="2 3" />
        <ReferenceLine y={30} stroke="rgba(34,197,94,0.4)"   strokeDasharray="2 3" />
        <Tooltip
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10, padding: '4px 8px' }}
          formatter={(v: unknown) => [(v as number).toFixed(1), 'RSI']}
          labelFormatter={() => ''}
        />
        <Line dataKey="rsi" stroke="#8b5cf6" dot={false} strokeWidth={1.5} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function rsiColor(v: number | null) {
  if (!v) return 'var(--text-3)';
  return v >= 70 ? '#ef4444' : v <= 30 ? '#22c55e' : '#a1a1aa';
}

function tsiColor(v: number | null) {
  if (!v) return 'var(--text-3)';
  return v > 0 ? '#22c55e' : '#ef4444';
}

function trendLabel(t: string | null) {
  if (!t) return { text: '—', color: 'var(--text-3)' };
  const map: Record<string, { text: string; color: string }> = {
    'strong-up':   { text: '↑↑ Strong uptrend',  color: '#22c55e' },
    'up':          { text: '↑ Uptrend',           color: '#22c55e' },
    'mixed':       { text: '↔ Mixed',             color: '#eab308' },
    'down':        { text: '↓ Downtrend',          color: '#ef4444' },
    'strong-down': { text: '↓↓ Strong downtrend', color: '#ef4444' },
  };
  return map[t] ?? { text: t, color: 'var(--text-3)' };
}

function deriveActionSignal(
  sig: Pick<AssetSignal, 'tsiValue' | 'tsiSignal' | 'tsiCross' | 'rsi' | 'rsiSignal' | 'rsiCrossAbove30' | 'trend'>,
  mode: 'exit' | 'dca',
): { actionSignal: AssetSignal['actionSignal']; actionLabel: string; actionDetail: string } {
  const { tsiValue, tsiSignal, tsiCross, rsi, rsiSignal, rsiCrossAbove30, trend } = sig;

  if (mode === 'exit') {
    // Unlock timing for SOL: want BEARISH signals = short building profit, good time to close
    const tsiBearishCross  = tsiCross === 'bearish';
    const tsiBelowSignal   = tsiValue !== null && tsiSignal !== null && tsiValue < tsiSignal;
    const isBearishMomentum = tsiBearishCross || (tsiBelowSignal && (trend === 'down' || trend === 'strong-down'));
    const isOverbought = rsiSignal === 'overbought';
    const isOversold   = rsiSignal === 'oversold';

    // TSI bearish cross = strongest unlock signal
    if (tsiBearishCross) {
      return {
        actionSignal: 'close-now',
        actionLabel: '✓ UNLOCK NOW — TSI bearish cross',
        actionDetail: 'TSI crossed BELOW signal line — momentum has turned bearish. This is your primary unlock trigger. Execute your SOL gradual close.',
      };
    }
    if (isOversold && rsiCrossAbove30) {
      return {
        actionSignal: 'wait',
        actionLabel: 'WAIT — RSI oversold bounce',
        actionDetail: 'RSI recovered above 30 (oversold reversal). Price may bounce up. Your short would lose value. Wait for momentum to roll over again.',
      };
    }
    if (isOverbought) {
      return {
        actionSignal: 'close-now',
        actionLabel: '✓ GOOD — RSI overbought, pullback likely',
        actionDetail: 'RSI in overbought zone (>70). Likely to pull back. Short building profit. Consider executing close plan if TSI also below signal.',
      };
    }
    if (isBearishMomentum) {
      return {
        actionSignal: 'close-now',
        actionLabel: '✓ GOOD — Bearish momentum confirmed',
        actionDetail: 'TSI below signal line + downtrend. Short is building profit. Execute gradual SOL close when short price ≤ $78.07.',
      };
    }
    if (trend === 'up' || trend === 'strong-up') {
      return {
        actionSignal: 'wait',
        actionLabel: 'WAIT — Uptrend, short losing',
        actionDetail: 'Uptrend = your short is losing value. Do not unlock yet. Wait for TSI to cross below signal line before executing.',
      };
    }
    return {
      actionSignal: 'wait',
      actionLabel: 'NEUTRAL — No TSI unlock signal yet',
      actionDetail: 'No strong bearish signal. Watch for TSI to cross below signal line (primary trigger) or RSI >70 as secondary confirmation.',
    };
  }

  // For DCA (BTC long after all shorts closed): want BULLISH reversal = good time to add
  const tsiBullishCross   = tsiCross === 'bullish';
  const tsiAboveSignal    = tsiValue !== null && tsiSignal !== null && tsiValue > tsiSignal;
  const isOversoldReverse = rsiSignal === 'oversold' && rsiCrossAbove30;

  // TSI bullish cross + RSI oversold reversal = strongest DCA signal
  if (tsiBullishCross && isOversoldReverse) {
    return {
      actionSignal: 'dca-now',
      actionLabel: '✓ DCA NOW — TSI cross + RSI reversal',
      actionDetail: 'TSI crossed ABOVE signal line AND RSI bounced from oversold. Dual confirmation — highest-confidence DCA entry. Add your planned BTC.',
    };
  }
  if (isOversoldReverse) {
    return {
      actionSignal: 'dca-now',
      actionLabel: '✓ DCA NOW — RSI oversold reversal',
      actionDetail: 'RSI crossed above 30 (oversold recovery). Strong DCA entry signal. Price likely found support. Watch TSI for further confirmation.',
    };
  }
  if (tsiBullishCross) {
    return {
      actionSignal: 'dca-watch',
      actionLabel: 'DCA WATCH — TSI bullish cross',
      actionDetail: 'TSI crossed ABOVE signal line — momentum turning bullish. Wait for RSI to also confirm (cross above 30 or reach oversold zone) before full DCA.',
    };
  }
  if (tsiAboveSignal && (trend === 'up' || trend === 'mixed')) {
    return {
      actionSignal: 'dca-watch',
      actionLabel: 'DCA WATCH — Momentum improving',
      actionDetail: 'TSI above signal, trend recovering. Wait for a dip (RSI oversold) as your ideal DCA entry level.',
    };
  }
  if (rsiSignal === 'oversold') {
    return {
      actionSignal: 'dca-watch',
      actionLabel: 'DCA WATCH — RSI oversold zone',
      actionDetail: 'RSI in oversold territory. Watch for RSI to cross above 30 AND TSI bullish cross as dual-confirmation entry trigger.',
    };
  }
  if (trend === 'down' || trend === 'strong-down') {
    return {
      actionSignal: 'wait',
      actionLabel: 'WAIT — Downtrend, no TSI signal',
      actionDetail: 'Still in downtrend and TSI bearish. Better DCA levels likely ahead. Wait for TSI bullish cross or RSI oversold before entering.',
    };
  }
  return {
    actionSignal: 'wait',
    actionLabel: 'NEUTRAL — Waiting for TSI signal',
    actionDetail: 'No strong bullish signal. Watch for TSI bullish cross (primary) or RSI crossing above 30 from oversold (secondary) to confirm DCA entry.',
  };
}

const ACTION_STYLE: Record<string, { bg: string; border: string; color: string; Icon: React.ElementType }> = {
  'close-now':  { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  color: '#22c55e', Icon: TrendingDown },
  'wait':       { bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.2)', color: '#a1a1aa', Icon: Minus },
  'dca-now':    { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  color: '#22c55e', Icon: TrendingUp },
  'dca-watch':  { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  color: '#eab308', Icon: TrendingUp },
};

export default function MarketSignals({ pairs, phase }: Props) {
  const [signals, setSignals] = useState<AssetSignal[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine mode per symbol
  const modeFor = useCallback((sym: string): 'exit' | 'dca' => {
    if (phase === 'btc-dca' && sym === 'BTC') return 'dca';
    if (phase === 'sol-exit' && sym === 'SOL') return 'exit';
    // Default: SOL = exit, BTC = dca
    return sym === 'BTC' ? 'dca' : 'exit';
  }, [phase]);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Initialise with loading state
    setSignals(pairs.map(p => ({
      symbol: p.symbol,
      color: p.color,
      currentPrice: p.long.currentPrice,
      tsiValue: null, tsiSignal: null, tsiCross: 'none',
      tsiSparkline: [],
      rsi: null, rsiSignal: null, rsiCrossAbove30: false, rsiSparkline: [],
      trend: null, ema20: null, sma50: null, sma200: null,
      actionSignal: 'wait', actionLabel: 'Loading…', actionDetail: '',
      loading: true, error: null,
    })));

    for (const pair of pairs) {
      try {
        const candles: OHLCCandle[] = await fetchOHLC(pair.coinGeckoId, 365);
        const tsiResult  = calcTSI(candles.map(c => c.close));
        const rsiResult  = calcRSI(candles);
        const maResult   = calcMAs(candles);

        const tsiCross: AssetSignal['tsiCross'] =
          tsiResult?.recentCrossUp   ? 'bullish' :
          tsiResult?.recentCrossDown ? 'bearish' : 'none';

        const mode = modeFor(pair.symbol);
        const { actionSignal, actionLabel, actionDetail } = deriveActionSignal(
          {
            tsiValue:       tsiResult?.latestTSI    ?? null,
            tsiSignal:      tsiResult?.latestSignal ?? null,
            tsiCross,
            rsi:            rsiResult?.value         ?? null,
            rsiSignal:      rsiResult?.signal        ?? null,
            rsiCrossAbove30: rsiResult?.crossAbove30 ?? false,
            trend:          maResult?.trend          ?? null,
          },
          mode,
        );

        setSignals(prev => prev.map(s => s.symbol === pair.symbol ? {
          ...s,
          tsiValue:    tsiResult?.latestTSI    ?? null,
          tsiSignal:   tsiResult?.latestSignal ?? null,
          tsiCross,
          tsiSparkline: tsiResult?.sparkline ?? [],
          rsi:          rsiResult?.value      ?? null,
          rsiSignal:    rsiResult?.signal     ?? null,
          rsiCrossAbove30: rsiResult?.crossAbove30 ?? false,
          rsiSparkline: rsiResult?.sparkline ?? [],
          trend:        maResult?.trend ?? null,
          ema20:        maResult?.ema20 ?? null,
          sma50:        maResult?.sma50 ?? null,
          sma200:       maResult?.sma200 ?? null,
          actionSignal, actionLabel, actionDetail,
          loading: false,
        } : s));
      } catch {
        setSignals(prev => prev.map(s => s.symbol === pair.symbol ? {
          ...s, loading: false, error: 'Failed to fetch OHLC data',
          actionLabel: 'Error', actionDetail: '',
        } : s));
      }
    }
    setLoading(false);
  }, [pairs, modeFor]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const td = trendLabel;

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold t-1 text-base">Market Signals</h2>
          <p className="text-[11px] t-3 mt-0.5">
            TSI momentum + RSI + MAs — use to time when to unlock the hedge
          </p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium t-2 hover:t-1 transition-colors"
          style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}>
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {signals.map(sig => {
          const tPct = sig.ema20 && sig.currentPrice
            ? ((sig.currentPrice - sig.ema20) / sig.ema20) * 100 : null;
          const { bg, border, color, Icon } = ACTION_STYLE[sig.actionSignal];
          const mode = modeFor(sig.symbol);
          const tdInfo = td(sig.trend);

          return (
            <div key={sig.symbol} className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center"
                    style={{ background: sig.color }}>{sig.symbol.slice(0, 3)}</div>
                  <div>
                    <div className="text-sm font-semibold t-1">{sig.symbol}/USDT</div>
                    <div className="text-[10px] t-3">{mode === 'exit' ? 'Close timing' : 'DCA entry timing'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold t-1">${sig.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                  <div className="text-[10px] font-semibold" style={{ color: tdInfo.color }}>{tdInfo.text}</div>
                </div>
              </div>

              {sig.loading && (
                <div className="px-3 pb-3 flex items-center gap-2 text-xs t-3">
                  <RefreshCw size={11} className="animate-spin" />
                  Fetching 365 days of candle data…
                </div>
              )}

              {sig.error && (
                <div className="mx-3 mb-3 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertTriangle size={11} />
                  {sig.error}
                </div>
              )}

              {!sig.loading && !sig.error && (
                <>
                  {/* Action signal banner */}
                  <div className="mx-3 mb-2 rounded-lg px-2.5 py-2" style={{ background: bg, border: `1px solid ${border}` }}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon size={12} style={{ color }} />
                      <span className="text-[11px] font-bold" style={{ color }}>{sig.actionLabel}</span>
                    </div>
                    <div className="text-[10px] t-2 leading-snug">{sig.actionDetail}</div>
                  </div>

                  {/* TSI Hero — primary unlock momentum indicator */}
                  <div className="mx-3 mb-2 rounded-lg p-2"
                    style={{
                      background: sig.tsiCross === 'bearish' ? 'rgba(239,68,68,0.08)' :
                                  sig.tsiCross === 'bullish' ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
                      border: sig.tsiCross === 'bearish' ? '1px solid rgba(239,68,68,0.3)' :
                              sig.tsiCross === 'bullish' ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                    }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider t-3">
                        TSI — Unlock Momentum
                      </span>
                      <span className="text-[9px] font-semibold" style={{ color: tsiColor(sig.tsiValue) }}>
                        {sig.tsiValue !== null ? sig.tsiValue.toFixed(1) : '—'}
                        {sig.tsiSignal !== null ? ` / sig ${sig.tsiSignal.toFixed(1)}` : ''}
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold" style={{ color:
                      sig.tsiCross === 'bearish' ? '#ef4444' :
                      sig.tsiCross === 'bullish' ? '#22c55e' :
                      sig.tsiValue !== null && sig.tsiSignal !== null
                        ? (sig.tsiValue > sig.tsiSignal ? '#22c55e' : '#ef4444') : 'var(--text-3)'
                    }}>
                      {sig.tsiCross === 'bearish' ? '↓ Bearish Cross — unlock trigger!' :
                       sig.tsiCross === 'bullish' ? '↑ Bullish Cross — DCA trigger!' :
                       sig.tsiValue !== null && sig.tsiSignal !== null
                         ? sig.tsiValue > sig.tsiSignal ? '▲ Above signal line (bullish)' : '▼ Below signal line (bearish)'
                         : 'Loading…'}
                    </div>
                    {sig.tsiValue !== null && (
                      <div className="text-[9px] t-3 mt-0.5">
                        {sig.tsiValue < -25 ? '⚠ Deeply oversold (< −25)' :
                         sig.tsiValue >  25 ? 'Elevated momentum (> +25)' :
                         'Momentum in neutral zone'}
                      </div>
                    )}
                  </div>

                  {/* RSI + EMA20 row */}
                  <div className="grid grid-cols-2 gap-1 px-3 mb-2">
                    {/* RSI */}
                    <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div className="text-[9px] t-3 uppercase tracking-wide">RSI (14)</div>
                      <div className="text-xs font-bold" style={{ color: rsiColor(sig.rsi) }}>
                        {sig.rsi !== null ? sig.rsi.toFixed(1) : '—'}
                      </div>
                      <div className="text-[9px]" style={{ color: rsiColor(sig.rsi) }}>
                        {sig.rsiSignal === 'overbought' ? '🔴 overbought' :
                         sig.rsiSignal === 'oversold'   ? '🟢 oversold' : '— neutral'}
                      </div>
                    </div>

                    {/* EMA20 */}
                    <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div className="text-[9px] t-3 uppercase tracking-wide">EMA 20</div>
                      <div className="text-xs font-bold" style={{ color: tPct !== null ? (tPct > 0 ? '#22c55e' : '#ef4444') : 'var(--text-3)' }}>
                        {sig.ema20 !== null ? `$${Math.round(sig.ema20).toLocaleString()}` : '—'}
                      </div>
                      <div className="text-[9px]" style={{ color: tPct !== null ? (tPct > 0 ? '#22c55e' : '#ef4444') : 'var(--text-3)' }}>
                        {tPct !== null ? `${tPct > 0 ? '+' : ''}${tPct.toFixed(1)}% vs price` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Moving averages */}
                  <div className="grid grid-cols-3 gap-1 px-3 mb-2 text-[10px]">
                    {[
                      { label: 'EMA 20', val: sig.ema20 },
                      { label: 'SMA 50', val: sig.sma50 },
                      { label: 'SMA 200', val: sig.sma200 },
                    ].map(({ label, val }) => {
                      const above = val ? sig.currentPrice > val : null;
                      return (
                        <div key={label} className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: above === null ? 'var(--text-3)' : above ? '#22c55e' : '#ef4444' }} />
                          <span className="t-3">{label}</span>
                          <span className="font-semibold" style={{ color: above === null ? 'var(--text-3)' : above ? '#22c55e' : '#ef4444' }}>
                            {above === null ? '—' : above ? '↑' : '↓'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* TSI sparkline */}
                  {sig.tsiSparkline.length > 3 && (
                    <div className="px-3 mb-1">
                      <div className="flex justify-between text-[9px] t-3 mb-0.5">
                        <span>TSI (orange = signal line)</span>
                        <span>last 30 days</span>
                      </div>
                      <Sparkline data={sig.tsiSparkline} color={sig.color} />
                    </div>
                  )}

                  {/* RSI sparkline */}
                  {sig.rsiSparkline.length > 3 && (
                    <div className="px-3 pb-3">
                      <div className="flex justify-between text-[9px] t-3 mb-0.5">
                        <span>RSI (14) · 30=oversold · 70=overbought</span>
                        <span style={{ color: rsiColor(sig.rsi) }}>
                          {sig.rsi?.toFixed(1)}
                        </span>
                      </div>
                      <RSISparkline data={sig.rsiSparkline} />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="rounded-lg p-2.5 text-[10px] t-3 leading-snug space-y-1"
        style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
        <div className="font-semibold t-2 text-[11px]">How to read these signals</div>
        <div>
          <span className="text-orange-400 font-semibold">TSI (True Strength Index): </span>
          Your primary unlock momentum indicator. TSI bearish cross (drops below signal line) = unlock SOL hedge trigger.
          TSI bullish cross (rises above signal line) = DCA BTC entry confirmation.
        </div>
        <div>
          <span className="font-semibold t-2">RSI (14): </span>
          RSI &lt;30 = oversold (bounce likely — wait if short, DCA if long). RSI &gt;70 = overbought (pullback likely — good for shorts).
        </div>
        <div>
          <span className="font-semibold t-2">MAs: </span>
          Price above EMA20/SMA50/SMA200 = uptrend. All below = strong downtrend (shorts doing well).
        </div>
        <div className="text-orange-400">⚠ Daily candles — signals lag 1–2 days. Always confirm on your Bybit live chart before executing any trade.</div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldCheck, TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import {
  LineChart, Line, ReferenceLine, ResponsiveContainer, Tooltip,
} from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset, HedgeSignalResult, HedgeSignalType } from '@/lib/types';
import { loadPortfolio } from '@/lib/storage';
import { fetchOHLC } from '@/lib/coingecko';
import { calcHedgeSignal } from '@/lib/hedgeSignal';
import { calcAssetPnL, fmtCurrency, fmtPercent } from '@/lib/calculations';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HedgePair {
  long: CryptoAsset;
  short: CryptoAsset;
  signal: HedgeSignalResult | null;
  loading: boolean;
  error: string | null;
}

// ── Signal presentation helpers ───────────────────────────────────────────────

const SIGNAL_CONFIG: Record<HedgeSignalType, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
  description: string;
}> = {
  UNLOCK: {
    label: 'Unlock',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.3)',
    icon: TrendingUp,
    description: 'Conditions favour reducing or closing the short hedge — let the long position run.',
  },
  WATCH: {
    label: 'Watch',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.1)',
    border: 'rgba(234,179,8,0.3)',
    icon: TrendingUp,
    description: 'Momentum is building but not all conditions are confirmed. Monitor closely.',
  },
  HOLD: {
    label: 'Hold',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.3)',
    icon: Minus,
    description: 'No clear directional edge. Maintain the hedge and wait for a better signal.',
  },
  RELOCK: {
    label: 'Re-lock',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    icon: TrendingDown,
    description: 'Risk is rising. Re-establish or tighten the hedge to protect against further drawdown.',
  },
};

const CONFIDENCE_COLOR: Record<string, string> = {
  High:     '#22c55e',
  Moderate: '#eab308',
  Weak:     '#94a3b8',
};

// ── Sparkline tooltip ─────────────────────────────────────────────────────────

function SparkTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-2 py-1.5 text-[10px] shadow-lg space-y-0.5">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.name === 'tsi' ? '#6366f1' : '#f97316' }} />
          <span className="t-2 capitalize">{p.name}:</span>
          <span className="font-semibold t-1">{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Signal card ───────────────────────────────────────────────────────────────

function HedgePairCard({ pair }: { pair: HedgePair }) {
  const { long, short, signal, loading, error } = pair;
  const longPnL  = calcAssetPnL(long);
  const shortPnL = calcAssetPnL(short);

  const longValue  = longPnL.marketValue;
  const shortValue = shortPnL.marketValue;
  const netExposure = longValue > 0
    ? ((longValue - shortValue) / longValue) * 100
    : 100;

  const cfg = signal ? SIGNAL_CONFIG[signal.signal] : SIGNAL_CONFIG.HOLD;
  const SignalIcon = cfg.icon;

  return (
    <GlassCard className="p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${long.color}dd, ${long.color}66)` }}>
            {long.symbol.slice(0, 1)}
          </div>
          <div>
            <div className="text-sm font-semibold t-1">{long.symbol} Hedge Pair</div>
            <div className="text-[11px] t-3 mt-0.5">
              Long {fmtCurrency(longValue, 0)} · Short {fmtCurrency(shortValue, 0)}
            </div>
          </div>
        </div>

        {/* Signal badge */}
        {signal && !signal.insufficientData && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
              <SignalIcon size={11} />
              {cfg.label}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: CONFIDENCE_COLOR[signal.confidence] }}>
              {signal.confidence} confidence
            </div>
          </div>
        )}
      </div>

      {/* Net exposure bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] t-3 mb-1">
          <span>Net exposure</span>
          <span className="font-semibold t-2">{netExposure.toFixed(0)}% long</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, netExposure)}%`, background: long.color }} />
        </div>
        <div className="flex justify-between text-[9px] t-3 mt-0.5">
          <span>Fully hedged (0%)</span>
          <span>Fully exposed (100%)</span>
        </div>
      </div>

      {/* Loading / error / signal body */}
      {loading && (
        <div className="flex items-center gap-2 py-6 justify-center t-3 text-sm">
          <RefreshCw size={14} className="animate-spin" />
          Fetching 180 days of OHLC data…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-500"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {signal && !loading && !error && (
        <>
          {/* TSI Sparkline */}
          {signal.sparkline.length > 3 && (
            <div className="mb-3 rounded-xl overflow-hidden" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="text-[10px] t-3 font-medium">TSI (25,13,7) — last 30 days</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded" style={{ background: '#6366f1' }} />TSI</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded border-t border-dashed" style={{ borderColor: '#f97316' }} />Signal</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={70}>
                <LineChart data={signal.sparkline} margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
                  <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="3 3" />
                  <ReferenceLine y={-25} stroke="rgba(239,68,68,0.3)" strokeDasharray="2 4" />
                  <ReferenceLine y={25}  stroke="rgba(34,197,94,0.3)"  strokeDasharray="2 4" />
                  <Tooltip content={<SparkTooltip />} />
                  <Line dataKey="tsi"    stroke="#6366f1" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                  <Line dataKey="signal" stroke="#f97316" dot={false} strokeWidth={1}   strokeDasharray="4 2" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-3 pb-2 text-[10px] t-3">
                <span>TSI: <span className="font-semibold" style={{ color: signal.latestTSI > signal.latestSignalLine ? '#22c55e' : '#ef4444' }}>
                  {signal.latestTSI.toFixed(1)}
                </span></span>
                <span>Signal line: <span className="font-semibold t-2">{signal.latestSignalLine.toFixed(1)}</span></span>
                <span>ATR ratio: <span className={`font-semibold ${signal.atrRatio >= 1.5 ? 'text-red-500' : signal.atrRatio >= 1.2 ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {signal.atrRatio.toFixed(2)}×
                </span></span>
              </div>
            </div>
          )}

          {/* Signal description */}
          <div className="px-3 py-2 rounded-xl mb-3 text-[11px] t-2"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {cfg.description}
          </div>

          {/* Conditions checklist */}
          {!signal.insufficientData && (
            <div className="space-y-1.5">
              <div className="text-[10px] t-3 font-medium uppercase tracking-wide mb-1">
                Conditions ({signal.conditionsMet}/4 met)
              </div>
              {signal.reasons.map((r, i) => (
                <div key={i} className="text-[11px] t-2 leading-snug flex items-start gap-1.5">
                  <span className="flex-shrink-0 mt-0.5">{r.startsWith('✓') ? '✓' : '✗'}</span>
                  <span>{r.slice(2)}</span>
                </div>
              ))}
            </div>
          )}

          {signal.insufficientData && (
            <div className="flex items-start gap-2 text-[11px] t-3">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              {signal.reasons[0]}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}

// ── Unhedged positions ────────────────────────────────────────────────────────

function UnhedgedCard({ assets }: { assets: CryptoAsset[] }) {
  if (assets.length === 0) return null;
  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-semibold t-1 mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
        Unhedged Positions
      </h3>
      <div className="space-y-1.5">
        {assets.map(a => {
          const pnl = calcAssetPnL(a);
          const isShort = (a.direction ?? 'long') === 'short';
          return (
            <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: a.color }}>
                {a.symbol.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold t-1">{a.symbol}</span>
                <span className={`ml-1.5 text-[10px] px-1 py-0.5 rounded font-semibold ${isShort ? 'text-red-500 bg-red-500/10' : 'text-emerald-600 bg-emerald-500/10'}`}>
                  {isShort ? 'S' : 'L'}
                </span>
              </div>
              <span className="text-[11px] t-3">{fmtCurrency(pnl.marketValue, 0)}</span>
              <span className={`text-[11px] font-semibold ${pnl.unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtPercent(pnl.unrealizedPnLPercent)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] t-3 mt-2 leading-snug">
        To get TSI signals for these positions, edit them and link short positions to their corresponding long using "Hedges position."
      </p>
    </GlassCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HedgePage() {
  const [assets, setAssets]  = useState<CryptoAsset[]>([]);
  const [pairs, setPairs]    = useState<HedgePair[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const p = loadPortfolio();
    setAssets(p.assets);
  }, []);

  const buildPairs = useCallback((assetList: CryptoAsset[]): HedgePair[] => {
    const shorts = assetList.filter(a => a.hedgeFor);
    const result: HedgePair[] = [];
    for (const short of shorts) {
      const long = assetList.find(a => a.id === short.hedgeFor);
      if (long) result.push({ long, short, signal: null, loading: false, error: null });
    }
    return result;
  }, []);

  const fetchSignals = useCallback(async (assetList: CryptoAsset[]) => {
    const initial = buildPairs(assetList);
    if (initial.length === 0) { setPairs([]); return; }

    // Mark all as loading
    setPairs(initial.map(p => ({ ...p, loading: true })));
    setRefreshing(true);

    // Fetch each pair sequentially to stay within free-tier rate limits
    for (let i = 0; i < initial.length; i++) {
      const pair = initial[i];
      try {
        const candles = await fetchOHLC(pair.long.coinGeckoId, 180);
        const signal  = calcHedgeSignal(candles);
        setPairs(prev => prev.map((p, idx) =>
          idx === i ? { ...p, signal, loading: false } : p,
        ));
      } catch {
        setPairs(prev => prev.map((p, idx) =>
          idx === i ? { ...p, loading: false, error: 'Failed to load OHLC data. Check your connection or try again.' } : p,
        ));
      }
    }
    setRefreshing(false);
  }, [buildPairs]);

  useEffect(() => {
    if (assets.length > 0) fetchSignals(assets);
    else setPairs([]);
  }, [assets, fetchSignals]);

  // Which assets are not part of any hedge pair
  const pairedIds = new Set(pairs.flatMap(p => [p.long.id, p.short.id]));
  const unhedged  = assets.filter(a => !pairedIds.has(a.id));

  // Portfolio-level net exposure
  const totalLong  = assets.filter(a => (a.direction ?? 'long') === 'long')
    .reduce((s, a) => s + calcAssetPnL(a).marketValue, 0);
  const totalShort = assets.filter(a => a.direction === 'short' && a.hedgeFor)
    .reduce((s, a) => s + calcAssetPnL(a).marketValue, 0);
  const netPct = totalLong > 0 ? ((totalLong - totalShort) / totalLong) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold gradient-text">Hedge Manager</h1>
          <p className="text-[11px] t-3 mt-0.5 hidden sm:block">TSI-based signals for unlocking and re-locking your hedges</p>
        </div>
        <button
          onClick={() => fetchSignals(assets)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-2.5 py-1 glass rounded-full t-2 hover:text-orange-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span className="text-xs">{refreshing ? 'Updating…' : 'Refresh'}</span>
        </button>
      </div>

      {/* Portfolio net exposure summary */}
      {pairs.length > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={15} className="t-2" />
            <span className="text-sm font-semibold t-1">Portfolio Net Exposure</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, netPct)}%`,
                    background: netPct > 80 ? '#ef4444' : netPct > 50 ? '#f97316' : netPct > 20 ? '#eab308' : '#22c55e',
                  }} />
              </div>
              <div className="flex justify-between text-[9px] t-3 mt-0.5">
                <span>0% — fully hedged</span>
                <span>100% — fully exposed</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold t-1">{netPct.toFixed(0)}%</div>
              <div className="text-[10px] t-3">net long</div>
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-[11px] t-3">
            <span>Long <span className="t-1 font-semibold">{fmtCurrency(totalLong, 0)}</span></span>
            <span>Hedge shorts <span className="t-1 font-semibold">{fmtCurrency(totalShort, 0)}</span></span>
          </div>
        </GlassCard>
      )}

      {/* Methodology note */}
      <div className="px-3 py-2.5 rounded-xl flex items-start gap-2 text-[11px] t-3"
        style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
        <Info size={12} className="flex-shrink-0 mt-0.5 text-indigo-400" />
        <span>
          Signals use daily OHLC (180 days). TSI(25,13,7) measures momentum — 4 conditions must align for a High-confidence Unlock: fresh bullish TSI cross, prior oversold depth, calm volatility (ATR), and price above 20 EMA.
          <span className="text-orange-400 font-medium ml-1">These are signals, not instructions. Always apply your own judgement.</span>
        </span>
      </div>

      {/* No pairs state */}
      {pairs.length === 0 && assets.length > 0 && (
        <GlassCard className="p-6 text-center">
          <ShieldCheck size={28} className="t-3 mx-auto mb-2" />
          <div className="text-sm font-semibold t-1 mb-1">No hedge pairs linked yet</div>
          <p className="text-xs t-3 leading-snug max-w-xs mx-auto">
            Edit a short position in the dashboard and select which long position it hedges. The signal engine will then monitor TSI momentum to tell you when to unlock or re-lock.
          </p>
        </GlassCard>
      )}

      {assets.length === 0 && (
        <GlassCard className="p-6 text-center">
          <div className="text-sm t-3">Add assets in the dashboard first.</div>
        </GlassCard>
      )}

      {/* Hedge pair cards */}
      <div className="space-y-4">
        {pairs.map((pair, i) => <HedgePairCard key={i} pair={pair} />)}
      </div>

      {/* Unhedged positions */}
      <UnhedgedCard assets={unhedged} />
    </div>
  );
}

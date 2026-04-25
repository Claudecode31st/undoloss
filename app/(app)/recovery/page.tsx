'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Pencil, Check, X, TrendingUp, TrendingDown, Minus, ShieldCheck, Target, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { CryptoAsset } from '@/lib/types';
import { loadPortfolio, loadRecoveryTarget, saveRecoveryTarget } from '@/lib/storage';
import { calcAssetPnL, calcPortfolioStats, fmtCurrency, fmtPercent } from '@/lib/calculations';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Geometric progression: each stage requires the same % gain. */
function buildStages(current: number, target: number, count = 4): number[] {
  if (current <= 0 || target <= current) return [target];
  const factor = Math.pow(target / current, 1 / count);
  return Array.from({ length: count }, (_, i) => current * Math.pow(factor, i + 1));
}

/** Simulate long portfolio value with overridden prices (by coinGeckoId).
 *  Only longs are included — this shows how much the user can recover as prices rise.
 *  Short hedges offset gains but are managed separately via Hedge Manager signals.
 */
function simulatePortfolio(assets: CryptoAsset[], prices: Record<string, number>): number {
  return assets
    .filter(a => (a.direction ?? 'long') !== 'short')
    .reduce((sum, a) => {
      const price = prices[a.coinGeckoId] ?? a.currentPrice;
      return sum + calcAssetPnL({ ...a, currentPrice: price }).marketValue;
    }, 0);
}

/** Rank each position by what action to take first for recovery. */
function buildUnlockQueue(assets: CryptoAsset[]) {
  return assets
    .map(asset => {
      const pnl   = calcAssetPnL(asset);
      const isShort = (asset.direction ?? 'long') === 'short';
      const hedgedLong = asset.hedgeFor ? assets.find(a => a.id === asset.hedgeFor) : null;
      const hedgedLongPnL = hedgedLong ? calcAssetPnL(hedgedLong) : null;

      let priority: number;
      let action: string;
      let reason: string;
      let color: string;
      let icon: 'up' | 'down' | 'hold' | 'shield';

      if (isShort && hedgedLong && hedgedLongPnL && hedgedLongPnL.unrealizedPnL > 0) {
        // Hedge short on a profitable long — unlock first to let the profit run
        priority = 1;
        action   = 'Close short hedge';
        reason   = `${hedgedLong.symbol} long is up ${fmtPercent(hedgedLongPnL.unrealizedPnLPercent)} — removing this hedge unlocks that gain`;
        color    = '#22c55e';
        icon     = 'up';
      } else if (!isShort && pnl.unrealizedPnL > 0) {
        // Long already in profit
        priority = 2;
        action   = 'Let it run';
        reason   = `Already ${fmtPercent(pnl.unrealizedPnLPercent)} — your strongest recovery engine, protect it`;
        color    = '#22c55e';
        icon     = 'up';
      } else if (!isShort && pnl.unrealizedPnLPercent >= -15) {
        // Long near breakeven
        priority = 3;
        action   = 'Monitor closely';
        reason   = `Near breakeven at ${fmtPercent(pnl.unrealizedPnLPercent)} — watch for a momentum signal before adding exposure`;
        color    = '#eab308';
        icon     = 'hold';
      } else if (isShort && hedgedLong && hedgedLongPnL && hedgedLongPnL.unrealizedPnL < 0) {
        // Hedge short protecting a losing long — keep it
        priority = 4;
        action   = 'Keep hedge on';
        reason   = `${hedgedLong.symbol} long is ${fmtPercent(hedgedLongPnL.unrealizedPnLPercent)} — the short is limiting your loss here`;
        color    = '#f97316';
        icon     = 'shield';
      } else if (!isShort && pnl.unrealizedPnLPercent < -30) {
        // Deep loss long
        priority = 5;
        action   = 'Hedge if not already';
        reason   = `Down ${fmtPercent(pnl.unrealizedPnLPercent)} — needs confirmed reversal before unlocking. High priority to hedge if exposed.`;
        color    = '#ef4444';
        icon     = 'down';
      } else {
        priority = 3;
        action   = 'Monitor';
        reason   = 'No immediate action — watch for signal';
        color    = '#94a3b8';
        icon     = 'hold';
      }

      return { asset, pnl, priority, action, reason, color, icon };
    })
    .sort((a, b) => a.priority - b.priority);
}

const STAGE_STRATEGY = [
  {
    title: 'Survive',
    description: 'Protect what remains. Close the highest-priority hedge short first. No new leverage. One move at a time.',
  },
  {
    title: 'Stabilise',
    description: 'Begin selective exposure. Use Hedge Manager TSI signals before unlocking each position. Keep deeply underwater positions hedged.',
  },
  {
    title: 'Build',
    description: 'Scale into recovering positions. Winners can be sized up carefully. Losers stay hedged until the macro confirms.',
  },
  {
    title: 'Recover',
    description: "You're approaching breakeven. Stay disciplined — this is where most people over-leverage and give it all back. Take some profit, reduce risk.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StageCard({
  stage, index, targetValue, currentValue, isActive, isComplete,
}: {
  stage: number; index: number; targetValue: number; currentValue: number;
  isActive: boolean; isComplete: boolean;
}) {
  const multiplier = currentValue > 0 ? (stage / currentValue).toFixed(1) : '—';
  const pctGain    = currentValue > 0 ? ((stage / currentValue - 1) * 100).toFixed(0) : '—';
  const strategy   = STAGE_STRATEGY[index];

  return (
    <div className={`rounded-xl p-3 transition-all ${isActive ? 'ring-1 ring-orange-500/50' : ''}`}
      style={{
        background: isComplete ? 'rgba(34,197,94,0.06)' : isActive ? 'var(--surface)' : 'var(--surface-deep)',
        border: `1px solid ${isComplete ? 'rgba(34,197,94,0.25)' : isActive ? 'rgba(249,115,22,0.35)' : 'var(--border)'}`,
      }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
            isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-orange-500 text-white' : 'bg-transparent text-slate-400'
          }`} style={!isComplete && !isActive ? { border: '1px solid var(--border-strong)' } : undefined}>
            {isComplete ? '✓' : index + 1}
          </div>
          <span className={`text-xs font-semibold ${isComplete ? 'text-emerald-500' : isActive ? 'text-orange-400' : 't-3'}`}>
            {strategy.title}
          </span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${isComplete ? 'text-emerald-500' : isActive ? 't-1' : 't-3'}`}>
          {fmtCurrency(stage, 0)}
        </span>
      </div>

      {(isActive || isComplete) && (
        <>
          <div className="text-[10px] t-3 mb-1.5 leading-snug">{strategy.description}</div>
          <div className="flex gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded font-semibold t-2" style={{ background: 'var(--surface-deep)' }}>
              {multiplier}× from now
            </span>
            <span className="px-1.5 py-0.5 rounded font-semibold t-2" style={{ background: 'var(--surface-deep)' }}>
              +{pctGain}% needed
            </span>
          </div>
        </>
      )}
      {!isActive && !isComplete && (
        <div className="text-[10px] t-3 tabular-nums">
          +{pctGain}% from current · {multiplier}×
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [target, setTarget]       = useState(0);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput]     = useState('');
  const [simPrices, setSimPrices] = useState<Record<string, number>>({});
  const targetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = loadPortfolio();
    setAssets(p.assets);
    const saved = loadRecoveryTarget();
    const stats = calcPortfolioStats(p.assets);
    // Default target = original long investment (what the user is trying to recover to)
    const longInv = stats.longInvested > 0 ? stats.longInvested : stats.totalInvested;
    const defaultTarget = longInv > 0 ? longInv : stats.totalValue * 2;
    setTarget(saved ?? defaultTarget);
    // Init sim prices to current prices
    const prices: Record<string, number> = {};
    for (const a of p.assets) prices[a.coinGeckoId] = a.currentPrice;
    setSimPrices(prices);
  }, []);

  useEffect(() => {
    if (editingTarget && targetRef.current) targetRef.current.focus();
  }, [editingTarget]);

  const stats        = useMemo(() => calcPortfolioStats(assets), [assets]);
  // Use long-only investment as "Originally Invested" — short positions are hedges, not original capital
  const originalInvested = stats.longInvested > 0 ? stats.longInvested : stats.totalInvested;
  const currentValue = stats.longValue > 0 ? stats.longValue : stats.totalValue;
  const totalLost    = originalInvested - currentValue;
  const multiplier   = currentValue > 0 ? target / currentValue : 0;
  const pctNeeded    = (multiplier - 1) * 100;
  const stages       = useMemo(() => buildStages(currentValue, target, 4), [currentValue, target]);
  const activeStage  = stages.findIndex(s => currentValue < s);
  const simValue     = useMemo(() => simulatePortfolio(assets, simPrices), [assets, simPrices]);
  const simActiveStage = stages.findIndex(s => simValue < s);
  const unlockQueue  = useMemo(() => buildUnlockQueue(assets), [assets]);

  // Unique coins for scenario sliders
  const uniqueCoins = useMemo(() => {
    const seen = new Map<string, CryptoAsset>();
    for (const a of assets) {
      if (!seen.has(a.coinGeckoId)) seen.set(a.coinGeckoId, a);
    }
    return [...seen.values()];
  }, [assets]);

  function commitTarget() {
    const val = parseFloat(targetInput.replace(/[^0-9.]/g, ''));
    if (val > 0) {
      setTarget(val);
      saveRecoveryTarget(val);
    }
    setEditingTarget(false);
  }

  const simChanged = Math.abs(simValue - currentValue) > 1;

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="t-3 text-sm">Add assets in the dashboard first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold gradient-text">Recovery Roadmap</h1>
        <p className="text-[11px] t-3 mt-0.5 hidden sm:block">Your staged path from where you are to where you need to be</p>
      </div>

      {/* ── Recovery math banner ─────────────────────────────── */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current */}
          <div>
            <div className="text-[10px] t-3 uppercase tracking-wide mb-0.5">Long Portfolio</div>
            <div className="text-xl font-bold t-1">{fmtCurrency(currentValue)}</div>
            {originalInvested > 0 && (
              <div className={`text-xs mt-0.5 font-medium ${currentValue >= originalInvested ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtPercent(((currentValue - originalInvested) / originalInvested) * 100)} from entry
              </div>
            )}
          </div>

          {/* Invested / lost */}
          <div>
            <div className="text-[10px] t-3 uppercase tracking-wide mb-0.5">Originally Invested</div>
            <div className="text-xl font-bold t-1">{fmtCurrency(originalInvested)}</div>
            {totalLost > 0 && (
              <div className="text-xs mt-0.5 font-medium text-red-500">
                −{fmtCurrency(totalLost)} lost
              </div>
            )}
          </div>

          {/* Target */}
          <div>
            <div className="text-[10px] t-3 uppercase tracking-wide mb-0.5">Recovery Target</div>
            {editingTarget ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  ref={targetRef}
                  type="number"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitTarget(); if (e.key === 'Escape') setEditingTarget(false); }}
                  className="glass-input w-28 rounded-lg px-2 py-1 text-sm font-bold t-1"
                  placeholder={String(Math.round(target))}
                />
                <button onClick={commitTarget} className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-500/10">
                  <Check size={13} />
                </button>
                <button onClick={() => setEditingTarget(false)} className="p-1 rounded-lg t-3 hover:t-1">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setTargetInput(String(Math.round(target))); setEditingTarget(true); }}
                className="flex items-center gap-1.5 text-xl font-bold t-1 hover:text-orange-400 transition-colors group"
              >
                {fmtCurrency(target, 0)}
                <Pencil size={12} className="t-3 group-hover:text-orange-400 transition-colors" />
              </button>
            )}
            <div className="text-[10px] t-3 mt-0.5">tap to edit</div>
          </div>

          {/* What you need */}
          <div>
            <div className="text-[10px] t-3 uppercase tracking-wide mb-0.5">Need to Recover</div>
            <div className="text-xl font-bold text-orange-400">
              {multiplier >= 2 ? `${multiplier.toFixed(1)}×` : `+${pctNeeded.toFixed(0)}%`}
            </div>
            <div className="text-xs t-3 mt-0.5">
              {multiplier >= 2
                ? `+${pctNeeded.toFixed(0)}% · ${fmtCurrency(target - currentValue, 0)} to go`
                : `${fmtCurrency(target - currentValue, 0)} to go`}
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] t-3 mb-1">
            <span>Progress to target</span>
            <span className="font-semibold">{Math.min(100, (currentValue / target * 100)).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${Math.min(100, (currentValue / target) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] t-3 mt-0.5">
            <span>{fmtCurrency(currentValue, 0)}</span>
            <span>{fmtCurrency(target, 0)}</span>
          </div>
        </div>
      </GlassCard>

      {/* ── Stage milestones ──────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold t-2 uppercase tracking-wide mb-2 flex items-center gap-2">
          <Target size={12} className="text-orange-400" /> Staged Milestones
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stages.map((s, i) => (
            <StageCard
              key={i}
              stage={s}
              index={i}
              targetValue={target}
              currentValue={currentValue}
              isActive={activeStage === i}
              isComplete={currentValue >= s}
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ── Scenario simulator ───────────────────────────────── */}
        <GlassCard className="p-4">
          <h2 className="text-xs font-semibold t-2 uppercase tracking-wide mb-3 flex items-center gap-2">
            <TrendingUp size={12} className="text-indigo-400" /> Scenario Simulator
          </h2>

          {/* Simulated portfolio value */}
          <div className="px-3 py-2.5 rounded-xl mb-3 flex items-center justify-between"
            style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-[10px] t-3">Simulated Value</div>
              <div className={`text-lg font-bold ${simValue >= target ? 'text-emerald-500' : simValue > currentValue ? 'text-orange-400' : 't-1'}`}>
                {fmtCurrency(simValue)}
              </div>
            </div>
            <div className="text-right">
              {simChanged && (
                <>
                  <div className={`text-xs font-semibold ${simValue >= currentValue ? 'text-emerald-500' : 'text-red-500'}`}>
                    {simValue >= currentValue ? '+' : ''}{fmtCurrency(simValue - currentValue, 0)}
                  </div>
                  <div className="text-[10px] t-3">
                    {simActiveStage === -1
                      ? '🎯 Target reached!'
                      : simActiveStage > activeStage
                      ? `Reaches Stage ${simActiveStage + 1}`
                      : `Still Stage ${Math.max(1, activeStage + 1)}`}
                  </div>
                </>
              )}
              {!simChanged && <div className="text-[10px] t-3">Drag sliders to simulate</div>}
            </div>
          </div>

          <div className="space-y-3">
            {uniqueCoins.map(coin => {
              const currentP = coin.currentPrice;
              const simP     = simPrices[coin.coinGeckoId] ?? currentP;
              const mult     = currentP > 0 ? simP / currentP : 1;
              const min      = currentP * 0.1;
              const max      = currentP * 5;

              return (
                <div key={coin.coinGeckoId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ background: coin.color }}>
                        {coin.symbol.slice(0, 1)}
                      </span>
                      <span className="text-xs font-semibold t-1">{coin.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="t-3">{fmtCurrency(simP)}</span>
                      <span className={`font-semibold tabular-nums w-12 text-right ${
                        mult > 1 ? 'text-emerald-500' : mult < 1 ? 'text-red-500' : 't-3'
                      }`}>
                        {mult > 1 ? '+' : ''}{((mult - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={currentP * 0.005}
                    value={simP}
                    onChange={e => setSimPrices(p => ({ ...p, [coin.coinGeckoId]: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${coin.color} ${((simP - min) / (max - min)) * 100}%, var(--border-strong) ${((simP - min) / (max - min)) * 100}%)`,
                    }}
                  />
                  <div className="flex justify-between text-[9px] t-3 mt-0.5">
                    <span>−90%</span>
                    <span>Current</span>
                    <span>+400%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              const reset: Record<string, number> = {};
              for (const a of assets) reset[a.coinGeckoId] = a.currentPrice;
              setSimPrices(reset);
            }}
            className="mt-3 w-full py-1.5 rounded-lg text-xs t-3 hover:t-1 transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}
          >
            Reset to current prices
          </button>
        </GlassCard>

        {/* ── Unlock priority queue ─────────────────────────────── */}
        <GlassCard className="p-4">
          <h2 className="text-xs font-semibold t-2 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldCheck size={12} className="text-orange-400" /> Unlock Priority
          </h2>
          <p className="text-[11px] t-3 mb-3 leading-snug">
            Ordered by what to act on first. Use the Hedge Manager for exact timing of each unlock.
          </p>

          <div className="space-y-2">
            {unlockQueue.map(({ asset, pnl, priority, action, reason, color, icon }, i) => {
              const IconComp = icon === 'up' ? TrendingUp : icon === 'down' ? TrendingDown : icon === 'shield' ? ShieldCheck : Minus;
              return (
                <div key={asset.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                  {/* Priority number */}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: color + '20', border: `1px solid ${color}40`, color }}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold t-1">{asset.symbol}</span>
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${
                        (asset.direction ?? 'long') === 'short' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {(asset.direction ?? 'long') === 'short' ? 'S' : 'L'}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: color + '15', color }}>
                        {action}
                      </span>
                    </div>
                    <p className="text-[10px] t-3 mt-0.5 leading-snug">{reason}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className={`text-xs font-bold ${pnl.unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {fmtPercent(pnl.unrealizedPnLPercent)}
                    </div>
                    <IconComp size={11} style={{ color, marginTop: 2 }} className="ml-auto" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Link to hedge manager */}
          <a href="/hedge" className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-orange-500 transition-colors hover:bg-orange-500/10"
            style={{ border: '1px solid rgba(249,115,22,0.25)' }}>
            Open Hedge Manager for timing signals
            <ChevronRight size={12} />
          </a>
        </GlassCard>
      </div>
    </div>
  );
}

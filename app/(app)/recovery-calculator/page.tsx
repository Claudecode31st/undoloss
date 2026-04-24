'use client';
import { useState } from 'react';
import { Scissors, Anchor, TrendingDown, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import Header from '@/components/layout/Header';
import GlassCard from '@/components/ui/GlassCard';
import { usePortfolioRefresh } from '@/lib/usePortfolioRefresh';
import { calcPortfolioStats, fmtCurrency, fmtPercent } from '@/lib/calculations';

/* ── helpers ────────────────────────────────────────────────── */
function pctGainNeeded(target: number, base: number) {
  if (base <= 0) return 0;
  return ((target / base) - 1) * 100;
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {text}
    </span>
  );
}

/* ── main ───────────────────────────────────────────────────── */
export default function RecoveryCalculatorPage() {
  const { portfolio, refreshing, lastUpdated, refresh } = usePortfolioRefresh();
  const [freshCapital, setFreshCapital] = useState(1000);

  if (!portfolio) return <div className="t-3 p-8">Loading…</div>;
  if (portfolio.assets.length === 0) {
    return (
      <>
        <Header title="Recovery Calculator" subtitle="Model your path back to breakeven" lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
        <GlassCard className="p-8 text-center">
          <p className="t-3 text-sm">Add assets to your portfolio first.</p>
        </GlassCard>
      </>
    );
  }

  const stats = calcPortfolioStats(portfolio.assets);
  const { totalValue: cur, totalInvested: inv } = stats;
  const pnlPct = inv > 0 ? ((cur - inv) / inv) * 100 : 0; // negative = loss
  const drawdown = Math.abs(Math.min(pnlPct, 0));
  const lossAmt = cur - inv; // negative

  /* ── Three paths ─────────────────────────────────────────── */
  // HOLD: need cur → inv
  const holdReq = pctGainNeeded(inv, cur);

  // CUT & RESTART: take cur cash + fresh, need it to reach inv
  const cutPool = cur + freshCapital;
  const cutReq = inv > cutPool ? pctGainNeeded(inv, cutPool) : 0;
  const cutAlreadyBE = inv <= cutPool;

  // DCA DOWN: hold + deploy fresh at current prices
  const dcaNewInv = inv + freshCapital;
  const dcaPool = cur + freshCapital;
  const dcaReq = dcaNewInv > dcaPool ? pctGainNeeded(dcaNewInv, dcaPool) : 0;
  const dcaAlreadyBE = dcaNewInv <= dcaPool;

  /* ── Per-asset DCA zones ─────────────────────────────────── */
  const sorted = [...portfolio.assets].sort(
    (a, b) => b.currentPrice * b.amount - a.currentPrice * a.amount,
  );
  const perAssetBudget = freshCapital / Math.max(portfolio.assets.length, 1);

  /* ── Milestones ──────────────────────────────────────────── */
  // Build milestones from current drawdown down to 0%
  const currentDraw = Math.floor(drawdown / 10) * 10; // floor to nearest 10
  const milestoneDrawdowns: number[] = [];
  for (let d = currentDraw; d >= 0; d -= 10) {
    milestoneDrawdowns.push(d);
  }
  if (milestoneDrawdowns[milestoneDrawdowns.length - 1] !== 0) milestoneDrawdowns.push(0);

  // Gain needed to reach a given drawdown level (d = 0…100)
  function gainToMilestone(targetDrawdown: number) {
    // Portfolio value at that drawdown = inv * (1 - targetDrawdown/100)
    const targetValue = inv * (1 - targetDrawdown / 100);
    return pctGainNeeded(targetValue, cur);
  }

  return (
    <>
      <Header
        title="Recovery Calculator"
        subtitle="Model your real path back to breakeven"
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      {/* ── Situation Brief ─────────────────────────────────── */}
      <GlassCard className="p-5 mb-4" style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <div className="text-[10px] t-3 mb-0.5">Current drawdown</div>
            <div className="text-2xl font-bold text-red-500">−{drawdown.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] t-3 mb-0.5">Loss amount</div>
            <div className="text-lg font-bold text-red-500">{fmtCurrency(lossAmt)}</div>
          </div>
          <div>
            <div className="text-[10px] t-3 mb-0.5">Invested</div>
            <div className="text-lg font-semibold t-1">{fmtCurrency(inv)}</div>
          </div>
          <div>
            <div className="text-[10px] t-3 mb-0.5">Current value</div>
            <div className="text-lg font-semibold t-1">{fmtCurrency(cur)}</div>
          </div>
          <div className="ml-auto">
            <div className="text-[10px] t-3 mb-0.5">To break even — hold only</div>
            <div className="text-2xl font-bold text-red-500">+{holdReq.toFixed(1)}%</div>
          </div>
        </div>
      </GlassCard>

      {/* ── Capital Input ────────────────────────────────────── */}
      <GlassCard className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold t-1">Fresh Capital to Deploy</h2>
            <p className="text-xs t-3 mt-0.5">Adjust to see how new capital changes your recovery math</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-orange-500">{fmtCurrency(freshCapital, 0)}</div>
          </div>
        </div>
        <input
          type="range" min={0} max={20000} step={100}
          value={freshCapital}
          onChange={(e) => setFreshCapital(Number(e.target.value))}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full h-2 rounded-full appearance-none cursor-pointer mb-2"
          style={{
            background: `linear-gradient(to right, #f97316 ${(freshCapital / 20000) * 100}%, var(--border-strong) ${(freshCapital / 20000) * 100}%)`,
            touchAction: 'none',
          }}
        />
        <div className="flex justify-between text-[10px] t-3">
          <span>$0</span><span>$5k</span><span>$10k</span><span>$15k</span><span>$20k</span>
        </div>
      </GlassCard>

      {/* ── Three Paths ──────────────────────────────────────── */}
      <h2 className="text-xs font-semibold t-3 uppercase tracking-wider mb-2 px-1">Three Recovery Paths</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">

        {/* Path A: Cut & Restart */}
        <GlassCard className="p-4" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Scissors size={15} className="text-red-500" />
            </div>
            <div>
              <div className="text-sm font-semibold t-1">Cut &amp; Restart</div>
              <div className="text-[10px] t-3">Sell all, redeploy fresh</div>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">New pool</span>
              <span className="text-xs font-semibold t-1">{fmtCurrency(cutPool)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">Realized loss</span>
              <span className="text-xs font-semibold text-red-500">{fmtCurrency(lossAmt)}</span>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">Breakeven need</span>
              {cutAlreadyBE
                ? <Tag text="Already covered ✓" color="bg-emerald-500/20 text-emerald-500 border-emerald-500/30" />
                : <span className="text-base font-bold text-orange-500">+{cutReq.toFixed(1)}%</span>
              }
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-lg text-[10px] t-3 leading-relaxed" style={{ background: 'var(--surface-deep)' }}>
            Accept the realized loss. Start clean with less capital but a much lower recovery bar.
            {freshCapital > 0 && !cutAlreadyBE && (
              <span className="block mt-1 text-red-500 font-medium">
                vs. holding alone: saves {(holdReq - cutReq).toFixed(1)}pp of required gain
              </span>
            )}
          </div>
        </GlassCard>

        {/* Path B: Hold */}
        <GlassCard className="p-4" style={{ border: '1px solid rgba(251,146,60,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Anchor size={15} className="text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-semibold t-1">Hold</div>
              <div className="text-[10px] t-3">No new capital, wait it out</div>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">Capital needed</span>
              <span className="text-xs font-semibold t-1">$0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">Current value</span>
              <span className="text-xs font-semibold t-1">{fmtCurrency(cur)}</span>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">Breakeven need</span>
              <span className="text-base font-bold text-red-500">+{holdReq.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-lg text-[10px] t-3 leading-relaxed" style={{ background: 'var(--surface-deep)' }}>
            Zero cost to maintain. Needs the full {holdReq.toFixed(0)}% recovery from here. Best if you believe strongly in a bull run.
          </div>
        </GlassCard>

        {/* Path C: DCA Down */}
        <GlassCard className="p-4" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={15} className="text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-semibold t-1">Average Down</div>
              <div className="text-[10px] t-3">Deploy {fmtCurrency(freshCapital, 0)} at current prices</div>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">Total invested after</span>
              <span className="text-xs font-semibold t-1">{fmtCurrency(dcaNewInv)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">New pool value</span>
              <span className="text-xs font-semibold t-1">{fmtCurrency(dcaPool)}</span>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="flex justify-between items-center">
              <span className="text-xs t-3">New breakeven need</span>
              {dcaAlreadyBE
                ? <Tag text="Already covered ✓" color="bg-emerald-500/20 text-emerald-500 border-emerald-500/30" />
                : <span className="text-base font-bold text-emerald-500">+{dcaReq.toFixed(1)}%</span>
              }
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-lg text-[10px] t-3 leading-relaxed" style={{ background: 'var(--surface-deep)' }}>
            {freshCapital > 0 && !dcaAlreadyBE ? (
              <>
                Deploying {fmtCurrency(freshCapital, 0)} cuts your required gain from{' '}
                <span className="text-red-500 font-medium">+{holdReq.toFixed(0)}%</span> → {' '}
                <span className="text-emerald-500 font-medium">+{dcaReq.toFixed(0)}%</span>.
                Only worthwhile if you'd buy this asset fresh today.
              </>
            ) : (
              'Set fresh capital above $0 to see averaging impact.'
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── Per-Asset DCA Zones ───────────────────────────────── */}
      <GlassCard className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold t-1">Per-Asset Buy Zones</h2>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] t-3" style={{ border: '1px solid var(--border)', background: 'var(--surface-deep)' }}>
            <Info size={10} />
            <span>{fmtCurrency(perAssetBudget, 0)} budget per asset</span>
          </div>
        </div>

        <div className="space-y-4">
          {sorted.map((asset) => {
            const assetCost = asset.entryPrice * asset.amount;
            const assetValue = asset.currentPrice * asset.amount;
            const assetDrawdown = assetCost > 0 ? ((assetValue - assetCost) / assetCost) * 100 : 0;
            const assetBE = asset.entryPrice;
            const assetGainNeeded = asset.currentPrice > 0 ? ((assetBE / asset.currentPrice) - 1) * 100 : 0;

            // DCA stages: buy 1/3 of per-asset budget at each zone
            const stageCapital = perAssetBudget / 3;
            const zones = [0, -10, -20].map((dropPct, i) => {
              const zonePrice = asset.currentPrice * (1 + dropPct / 100);
              const tokensBought = zonePrice > 0 ? stageCapital / zonePrice : 0;
              // Cumulative after this stage
              const cumCapital = stageCapital * (i + 1);
              const cumExtraTokens = [0, -10, -20].slice(0, i + 1).reduce((sum, dp) => {
                const p = asset.currentPrice * (1 + dp / 100);
                return sum + (p > 0 ? stageCapital / p : 0);
              }, 0);
              const newTotalTokens = asset.amount + cumExtraTokens;
              const newTotalCost = assetCost + cumCapital;
              const newAvgEntry = newTotalCost / newTotalTokens;
              const newGainNeeded = asset.currentPrice > 0 ? ((newAvgEntry / asset.currentPrice) - 1) * 100 : 0;
              return { dropPct, zonePrice, stageCapital, newAvgEntry, newGainNeeded };
            });

            return (
              <div key={asset.id}>
                {/* Asset header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: asset.color + '22', border: `1px solid ${asset.color}44`, color: asset.color }}
                    >
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold t-1">{asset.symbol}</span>
                      <span className="text-[10px] t-3 ml-1.5">
                        {assetDrawdown < 0 ? fmtPercent(assetDrawdown, false) : '+0%'} · BE @ {fmtCurrency(assetBE)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs t-3">Needs</div>
                    <div className="text-sm font-bold text-red-500">+{assetGainNeeded.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Stage cards */}
                <div className="grid grid-cols-3 gap-2">
                  {zones.map((z, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] t-3">Stage {i + 1}</span>
                        <span className={`text-[10px] font-semibold ${z.dropPct === 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                          {z.dropPct === 0 ? 'Now' : `${z.dropPct}%`}
                        </span>
                      </div>
                      <div className="text-xs font-semibold t-1">{fmtCurrency(z.zonePrice)}</div>
                      <div className="text-[10px] t-3 mt-1">Deploy {fmtCurrency(z.stageCapital, 0)}</div>
                      <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="text-[10px] t-3">New avg entry</div>
                        <div className="text-xs font-semibold t-2">{fmtCurrency(z.newAvgEntry)}</div>
                        <div className="text-[10px] text-emerald-500 font-medium">Need +{Math.max(0, z.newGainNeeded).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider between assets */}
                {sorted.indexOf(asset) < sorted.length - 1 && (
                  <div className="mt-4" style={{ height: 1, background: 'var(--border)' }} />
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* ── Milestone Tracker ────────────────────────────────── */}
      <GlassCard className="p-5 mb-4">
        <h2 className="text-sm font-semibold t-1 mb-1">Recovery Milestones</h2>
        <p className="text-xs t-3 mb-4">Each step shows the portfolio gain required from today's prices</p>

        <div className="space-y-2">
          {milestoneDrawdowns.map((targetDraw, i) => {
            const isCurrentOrWorse = targetDraw >= drawdown - 5;
            const gainNeeded = gainToMilestone(targetDraw);
            const isCurrent = i === 0;
            const isBreakeven = targetDraw === 0;
            const targetValue = inv * (1 - targetDraw / 100);

            return (
              <div
                key={targetDraw}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isCurrent ? 'rgba(239,68,68,0.08)' : isBreakeven ? 'rgba(34,197,94,0.08)' : 'var(--surface-deep)',
                  border: `1px solid ${isCurrent ? 'rgba(239,68,68,0.25)' : isBreakeven ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  style={{
                    background: isCurrent ? 'rgba(239,68,68,0.15)' : isBreakeven ? 'rgba(34,197,94,0.15)' : 'var(--surface)',
                    color: isCurrent ? '#ef4444' : isBreakeven ? '#22c55e' : 'var(--text-3)',
                    border: `1px solid ${isCurrent ? 'rgba(239,68,68,0.3)' : isBreakeven ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  }}
                >
                  {isBreakeven ? '✓' : isCurrent ? '●' : `${i}`}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: isCurrent ? '#ef4444' : isBreakeven ? '#22c55e' : 'var(--text-1)' }}>
                      {isBreakeven ? 'Breakeven' : isCurrent ? `Current  −${drawdown.toFixed(0)}%` : `−${targetDraw}% drawdown`}
                    </span>
                    {isCurrent && <Tag text="You are here" color="bg-red-500/20 text-red-500 border-red-500/30" />}
                    {isBreakeven && <Tag text="Goal" color="bg-emerald-500/20 text-emerald-500 border-emerald-500/30" />}
                  </div>
                  <div className="text-[10px] t-3 mt-0.5">Portfolio value: {fmtCurrency(targetValue)}</div>
                </div>

                {/* Gain needed */}
                <div className="text-right flex-shrink-0">
                  {isCurrent ? (
                    <span className="text-xs t-3">—</span>
                  ) : (
                    <>
                      <div className="text-sm font-bold" style={{ color: isBreakeven ? '#22c55e' : 'var(--text-1)' }}>
                        +{gainNeeded.toFixed(1)}%
                      </div>
                      <div className="text-[10px] t-3">from now</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight callout */}
        <div className="mt-4 p-3 rounded-xl text-xs t-3 leading-relaxed" style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)' }}>
          <span className="text-orange-500 font-semibold">Key insight: </span>
          Focus on milestone 1 first. Going from −{drawdown.toFixed(0)}% to −{Math.max(0, (Math.floor(drawdown / 10) - 1) * 10).toFixed(0)}% only requires{' '}
          <span className="t-1 font-semibold">+{gainToMilestone(Math.max(0, (Math.floor(drawdown / 10) - 1) * 10)).toFixed(1)}%</span> — far more achievable
          than fixating on full recovery.
        </div>
      </GlassCard>
    </>
  );
}

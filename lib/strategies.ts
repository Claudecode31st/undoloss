import { CryptoAsset, StrategyMode, RiskMode, StrategyResult, RecommendedAction, DCAStage } from './types';
import { calcPortfolioStats, calcRiskScore, calcHedge, calcBreakevenPortfolio } from './calculations';
import { fmtCurrency } from './calculations';

export function generateStrategyResult(
  assets: CryptoAsset[],
  strategy: StrategyMode,
  riskMode: RiskMode,
  hedgeRatio: number
): StrategyResult {
  const stats = calcPortfolioStats(assets);
  const risk = calcRiskScore(assets);
  const hedge = calcHedge(assets, strategy === 'delta-neutral' ? hedgeRatio : 0);
  const breakevenMove = calcBreakevenPortfolio(assets);

  switch (strategy) {
    case 'dca':         return buildDCA(assets, stats, risk, riskMode);
    case 'breakeven':   return buildBreakeven(assets, stats, risk, breakevenMove);
    case 'risk-reduction': return buildRiskReduction(assets, stats, risk);
    case 'delta-neutral':  return buildDeltaNeutral(assets, stats, risk, hedgeRatio, hedge);
    case 'swing':       return buildSwing(assets, stats, risk);
    default:            return buildDCA(assets, stats, risk, riskMode);
  }
}

function buildDCA(
  assets: CryptoAsset[],
  stats: ReturnType<typeof calcPortfolioStats>,
  risk: ReturnType<typeof calcRiskScore>,
  riskMode: RiskMode
): StrategyResult {
  const multipliers =
    riskMode === 'conservative' ? [0.10, 0.20, 0.30] :
    riskMode === 'balanced'     ? [0.15, 0.25, 0.35] :
                                  [0.20, 0.30, 0.40];

  const topAsset = assets.slice().sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount))[0];

  const dcaStages: DCAStage[] = (topAsset ? [topAsset] : []).flatMap((asset) =>
    multipliers.map((m, i) => ({
      stage: i + 1,
      priceTarget: asset.currentPrice * (1 - m),
      percentFromCurrent: -m * 100,
      label: `Stage ${i + 1}: ${fmtCurrency(asset.currentPrice * (1 - m))} (−${(m * 100).toFixed(0)}%)`,
    }))
  );

  const stage1Price = topAsset ? fmtCurrency(topAsset.currentPrice * (1 - multipliers[0])) : '−';
  const stage2Price = topAsset ? fmtCurrency(topAsset.currentPrice * (1 - multipliers[1])) : '−';

  const actions: RecommendedAction[] = risk.score > 65
    ? [
        { order: 1, type: 'reduce', title: 'Reduce Risk First', description: `Risk score ${risk.score}/100 — trim exposure before adding` },
        { order: 2, type: 'dca',    title: `Stage 1 Buy at ${stage1Price}`, description: `−${(multipliers[0]*100).toFixed(0)}% from current (${riskMode} mode)` },
        { order: 3, type: 'reassess', title: 'Review in 7 Days', description: 'Check risk score & price action before Stage 2' },
      ]
    : [
        { order: 1, type: 'dca',    title: `Stage 1 Buy at ${stage1Price}`, description: `−${(multipliers[0]*100).toFixed(0)}% from current (${riskMode} mode)` },
        { order: 2, type: 'dca',    title: `Stage 2 Buy at ${stage2Price}`, description: `−${(multipliers[1]*100).toFixed(0)}% — only if Stage 1 triggered` },
        { order: 3, type: 'reassess', title: 'Review in 7 Days', description: 'Review market structure & adjust buy zones if needed' },
      ];

  return {
    mode: 'dca',
    name: 'DCA Recovery',
    description: 'Gradual averaging to lower entry',
    netExposureLabel: 'Long',
    netExposurePercent: 70,
    hedgeStatus: 'Not Hedged',
    longValue: stats.totalValue,
    hedgeValue: 0,
    freezeZoneActive: risk.score > 75,
    actions,
    dcaStages,
  };
}

function buildBreakeven(
  assets: CryptoAsset[],
  stats: ReturnType<typeof calcPortfolioStats>,
  risk: ReturnType<typeof calcRiskScore>,
  breakevenMove: number
): StrategyResult {
  const alertPrice = stats.totalValue * (1 + breakevenMove / 2 / 100);

  const actions: RecommendedAction[] = [
    { order: 1, type: 'hold',     title: `Hold — Need +${breakevenMove.toFixed(1)}%`, description: 'Current position is below cost basis — patience required' },
    { order: 2, type: 'hedge',    title: 'Hedge 25% Downside', description: 'Partial hedge limits losses while waiting for recovery' },
    { order: 3, type: 'reassess', title: `Set Alert at ${fmtCurrency(alertPrice)}`, description: '~50% of required recovery move — reassess at this level' },
  ];

  return {
    mode: 'breakeven',
    name: 'Break-even Planning',
    description: 'Plan exit near breakeven zone',
    netExposureLabel: 'Long',
    netExposurePercent: 75,
    hedgeStatus: 'Hedged 25%',
    longValue: stats.totalValue,
    hedgeValue: stats.totalValue * 0.25,
    freezeZoneActive: false,
    actions,
  };
}

function buildRiskReduction(
  assets: CryptoAsset[],
  stats: ReturnType<typeof calcPortfolioStats>,
  risk: ReturnType<typeof calcRiskScore>
): StrategyResult {
  const sorted = assets.slice().sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount));
  const topAsset = sorted[0];
  const topValue = topAsset ? topAsset.currentPrice * topAsset.amount : 0;
  const trimAmount = topValue * 0.20;

  const actions: RecommendedAction[] = [
    { order: 1, type: 'reduce',   title: `Trim ${topAsset?.symbol ?? 'Top'} by 20%`, description: `Sell ~${fmtCurrency(trimAmount)} to reduce concentration risk` },
    { order: 2, type: 'hold',     title: 'Hold Remaining 80%', description: 'Keep core position intact for potential recovery' },
    { order: 3, type: 'reassess', title: 'Reassess if Leverage Exposure >60%', description: `Current leveraged exposure: ${risk.leveragedPortfolioPct.toFixed(0)}% of portfolio` },
  ];

  return {
    mode: 'risk-reduction',
    name: 'Risk Reduction',
    description: 'Reduce exposure & protect capital',
    netExposureLabel: 'Reduced',
    netExposurePercent: 55,
    hedgeStatus: 'Partially Reduced',
    longValue: stats.totalValue,
    hedgeValue: trimAmount,
    freezeZoneActive: false,
    actions,
  };
}

function buildDeltaNeutral(
  assets: CryptoAsset[],
  stats: ReturnType<typeof calcPortfolioStats>,
  risk: ReturnType<typeof calcRiskScore>,
  hedgeRatio: number,
  hedge: ReturnType<typeof calcHedge>
): StrategyResult {
  const hedgeValue = fmtCurrency(hedge.hedgeValue);
  const topAsset = assets.slice().sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount))[0];
  const stage1 = topAsset ? fmtCurrency(topAsset.currentPrice * 0.75) : '−';

  const actions: RecommendedAction[] = [
    { order: 1, type: 'hedge',    title: `Hedge ${hedgeRatio}% = ${hedgeValue}`, description: 'Open short/hedge position to neutralise directional risk' },
    { order: 2, type: 'dca',      title: `DCA Trigger at ${stage1}`, description: 'Buy more only if price drops −25% from current' },
    { order: 3, type: 'reassess', title: 'Rebalance Every 7 Days', description: 'Adjust hedge ratio as portfolio value changes' },
  ];

  return {
    mode: 'delta-neutral',
    name: 'Delta-Neutral Hedging',
    description: 'Hedge to reduce market exposure',
    netExposureLabel: hedge.netExposureLabel,
    netExposurePercent: hedge.netExposurePercent,
    hedgeStatus: `Hedged ${hedgeRatio}%`,
    longValue: hedge.longValue,
    hedgeValue: hedge.hedgeValue,
    freezeZoneActive: hedge.freezeZoneActive,
    actions,
  };
}

function buildSwing(
  assets: CryptoAsset[],
  stats: ReturnType<typeof calcPortfolioStats>,
  risk: ReturnType<typeof calcRiskScore>
): StrategyResult {
  const topAsset = assets.slice().sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount))[0];
  const sellTarget  = topAsset ? fmtCurrency(topAsset.currentPrice * 1.10) : '−';
  const rebuyTarget = topAsset ? fmtCurrency(topAsset.currentPrice * 0.85) : '−';

  const actions: RecommendedAction[] = [
    { order: 1, type: 'hold',   title: `Wait for +10% Swing High`, description: `Target sell zone: ${sellTarget} — scale out 15%` },
    { order: 2, type: 'reduce', title: 'Scale Out 15% at Resistance', description: 'Partial sell locks in recovery, lowers average cost' },
    { order: 3, type: 'dca',    title: `Re-enter at ${rebuyTarget}`, description: '−15% from sell point — improves entry if price returns' },
  ];

  return {
    mode: 'swing',
    name: 'Swing Re-entry',
    description: 'Sell high, rebuy lower for better basis',
    netExposureLabel: 'Neutral',
    netExposurePercent: 50,
    hedgeStatus: 'Not Hedged',
    longValue: stats.totalValue,
    hedgeValue: 0,
    freezeZoneActive: false,
    actions,
  };
}

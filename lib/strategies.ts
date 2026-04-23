import { CryptoAsset, StrategyMode, RiskMode, StrategyResult, RecommendedAction, DCAStage } from './types';
import { calcPortfolioStats, calcRiskScore, calcHedge, calcBreakevenPortfolio } from './calculations';

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
    case 'dca':
      return buildDCA(assets, stats, risk, riskMode);
    case 'breakeven':
      return buildBreakeven(assets, stats, risk, breakevenMove);
    case 'risk-reduction':
      return buildRiskReduction(assets, stats, risk);
    case 'delta-neutral':
      return buildDeltaNeutral(assets, stats, risk, hedgeRatio, hedge);
    case 'swing':
      return buildSwing(assets, stats, risk);
    default:
      return buildDCA(assets, stats, risk, riskMode);
  }
}

function buildDCA(assets: CryptoAsset[], stats: ReturnType<typeof calcPortfolioStats>, risk: ReturnType<typeof calcRiskScore>, riskMode: RiskMode): StrategyResult {
  const multipliers = riskMode === 'conservative' ? [0.10, 0.20, 0.30] : riskMode === 'balanced' ? [0.15, 0.25, 0.35] : [0.20, 0.30, 0.40];

  const dcaStages: DCAStage[] = assets.slice(0, 1).flatMap((asset) =>
    multipliers.map((m, i) => ({
      stage: i + 1,
      priceTarget: asset.currentPrice * (1 - m),
      percentFromCurrent: -m * 100,
      label: `Stage ${i + 1}: -${(m * 100).toFixed(0)}% from current`,
    }))
  );

  const actions: RecommendedAction[] = [
    { order: 1, type: 'hold', title: 'Maintain Hedge at 50%', description: 'Reduces volatility and protects capital' },
    { order: 2, type: 'dca', title: 'DCA in 3 Stages', description: `Next buy zone at -25% from current` },
    { order: 3, type: 'reassess', title: 'Reassess in 7 Days', description: 'Review market structure & adjust' },
  ];

  if (risk.score > 65) {
    actions[0] = { order: 1, type: 'reduce', title: 'Reduce First', description: 'Risk is elevated — lower exposure before averaging' };
  }

  return {
    mode: 'dca',
    name: 'DCA Recovery',
    description: 'Gradual averaging to lower entry',
    netExposureLabel: 'Neutral',
    netExposurePercent: 8.6,
    hedgeStatus: 'Hedged 50%',
    longValue: stats.totalValue,
    hedgeValue: stats.totalValue * 0.5,
    freezeZoneActive: true,
    actions,
    dcaStages,
  };
}

function buildBreakeven(assets: CryptoAsset[], stats: ReturnType<typeof calcPortfolioStats>, risk: ReturnType<typeof calcRiskScore>, breakevenMove: number): StrategyResult {
  const actions: RecommendedAction[] = [
    { order: 1, type: 'hold', title: 'Hold Current Position', description: `Need +${breakevenMove.toFixed(1)}% to reach breakeven` },
    { order: 2, type: 'hedge', title: 'Partial Hedge 25%', description: 'Limit downside while waiting for recovery' },
    { order: 3, type: 'reassess', title: 'Set Price Alerts', description: 'Alert at 50% of required recovery move' },
  ];

  return {
    mode: 'breakeven',
    name: 'Break-even Planning',
    description: 'Plan exit near breakeven zone',
    netExposureLabel: 'Long',
    netExposurePercent: 15,
    hedgeStatus: 'Hedged 25%',
    longValue: stats.totalValue,
    hedgeValue: stats.totalValue * 0.25,
    freezeZoneActive: false,
    actions,
  };
}

function buildRiskReduction(assets: CryptoAsset[], stats: ReturnType<typeof calcPortfolioStats>, risk: ReturnType<typeof calcRiskScore>): StrategyResult {
  const topAsset = assets.slice().sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount))[0];
  const actions: RecommendedAction[] = [
    { order: 1, type: 'reduce', title: `Trim ${topAsset?.symbol ?? 'Top Asset'} 20%`, description: 'Reduce largest position to lower concentration risk' },
    { order: 2, type: 'hold', title: 'Hold Remaining', description: 'Keep core position intact for recovery' },
    { order: 3, type: 'reassess', title: 'Reassess Allocation', description: 'Rebalance if concentration exceeds 60%' },
  ];

  return {
    mode: 'risk-reduction',
    name: 'Risk Reduction',
    description: 'Reduce exposure & protect capital',
    netExposureLabel: 'Reduced',
    netExposurePercent: 5,
    hedgeStatus: 'Partially Reduced',
    longValue: stats.totalValue,
    hedgeValue: stats.totalValue * 0.2,
    freezeZoneActive: false,
    actions,
  };
}

function buildDeltaNeutral(assets: CryptoAsset[], stats: ReturnType<typeof calcPortfolioStats>, risk: ReturnType<typeof calcRiskScore>, hedgeRatio: number, hedge: ReturnType<typeof calcHedge>): StrategyResult {
  const actions: RecommendedAction[] = [
    { order: 1, type: 'hedge', title: `Maintain Hedge at ${hedgeRatio}%`, description: 'Reduces volatility and protects capital' },
    { order: 2, type: 'dca', title: 'DCA in 3 Stages', description: 'Next buy zone at -25% from current' },
    { order: 3, type: 'reassess', title: 'Reassess in 7 Days', description: 'Review market structure & adjust' },
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

function buildSwing(assets: CryptoAsset[], stats: ReturnType<typeof calcPortfolioStats>, risk: ReturnType<typeof calcRiskScore>): StrategyResult {
  const actions: RecommendedAction[] = [
    { order: 1, type: 'hold', title: 'Wait for Swing High', description: 'Sell near resistance, rebuy at support' },
    { order: 2, type: 'reduce', title: 'Scale Out 15%', description: 'Take partial profit at +10% from current' },
    { order: 3, type: 'dca', title: 'Rebuy at Support', description: 'Re-enter if price drops -15% from sell point' },
  ];

  return {
    mode: 'swing',
    name: 'Swing Re-entry',
    description: 'Sell high, rebuy lower',
    netExposureLabel: 'Neutral',
    netExposurePercent: 10,
    hedgeStatus: 'Not Hedged',
    longValue: stats.totalValue,
    hedgeValue: 0,
    freezeZoneActive: false,
    actions,
  };
}

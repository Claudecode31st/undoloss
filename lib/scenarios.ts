import { CryptoAsset, ScenarioOutcome } from './types';
import { calcPortfolioStats, calcBreakevenPortfolio } from './calculations';

export function generateScenarios(assets: CryptoAsset[]): ScenarioOutcome[] {
  const stats = calcPortfolioStats(assets);
  const breakevenMove = calcBreakevenPortfolio(assets);
  const drawdown = Math.abs(Math.min(stats.totalUnrealizedPnLPercent, 0));

  // Bull: strong market recovery
  const bullLow = Math.max(25, breakevenMove * 0.6);
  const bullHigh = Math.max(50, breakevenMove * 1.2);
  const bullRecoverable = breakevenMove <= bullHigh;

  // Sideways: modest drift
  const sidewaysLow = 10;
  const sidewaysHigh = 25;

  // Bear: further decline
  const bearLow = drawdown > 20 ? -10 : -5;
  const bearHigh = drawdown > 20 ? 10 : 8;

  return [
    {
      scenario: 'bull',
      name: 'Bull Scenario',
      returnRangeLow: Math.round(bullLow),
      returnRangeHigh: Math.round(bullHigh),
      recoveryTimeLow: '3',
      recoveryTimeHigh: '6',
      difficulty: bullRecoverable ? 'Good' : 'Moderate',
      color: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      icon: 'TrendingUp',
    },
    {
      scenario: 'sideways',
      name: 'Sideways Scenario',
      returnRangeLow: sidewaysLow,
      returnRangeHigh: sidewaysHigh,
      recoveryTimeLow: '6',
      recoveryTimeHigh: '12',
      difficulty: 'Moderate',
      color: 'text-yellow-400',
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      icon: 'Minus',
    },
    {
      scenario: 'bear',
      name: 'Bear Scenario',
      returnRangeLow: Math.round(bearLow),
      returnRangeHigh: Math.round(bearHigh),
      recoveryTimeLow: '12',
      recoveryTimeHigh: '',
      difficulty: 'Challenging',
      color: 'text-red-400',
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
      icon: 'TrendingDown',
    },
  ];
}

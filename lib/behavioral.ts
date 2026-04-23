import { CryptoAsset, BehavioralWarning } from './types';
import { calcPortfolioStats, calcRiskScore } from './calculations';

export function analyzeBehavior(assets: CryptoAsset[], tradeCount24h = 0, avgCount = 0): BehavioralWarning[] {
  const stats = calcPortfolioStats(assets);
  const risk = calcRiskScore(assets);
  const drawdown = Math.abs(Math.min(stats.totalUnrealizedPnLPercent, 0));

  // Panic selling risk: high drawdown + high concentration
  let panicLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  if (drawdown > 20 && risk.concentrationRisk === 'High') panicLevel = 'High';
  else if (drawdown > 15 || risk.concentrationRisk === 'High') panicLevel = 'Moderate';

  // Overtrading risk: based on trade frequency
  let overtradingLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  if (tradeCount24h > 5) overtradingLevel = 'High';
  else if (tradeCount24h > 2) overtradingLevel = 'Moderate';
  else if (drawdown > 25) overtradingLevel = 'Moderate'; // emotional overtrading tendency

  // Over-averaging risk: based on position size vs drawdown
  let overAvgLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  if (drawdown > 20 && avgCount > 2) overAvgLevel = 'High';
  else if (drawdown > 15) overAvgLevel = 'High';
  else if (drawdown > 10) overAvgLevel = 'Moderate';

  const colorMap = {
    Low: 'text-emerald-400',
    Moderate: 'text-yellow-400',
    High: 'text-red-400',
  };

  return [
    {
      type: 'panic-selling',
      name: 'Panic Selling Risk',
      level: panicLevel,
      color: colorMap[panicLevel],
      icon: 'AlertTriangle',
    },
    {
      type: 'overtrading',
      name: 'Overtrading Risk',
      level: overtradingLevel,
      color: colorMap[overtradingLevel],
      icon: 'Zap',
    },
    {
      type: 'over-averaging',
      name: 'Over-Averaging Risk',
      level: overAvgLevel,
      color: colorMap[overAvgLevel],
      icon: 'Target',
    },
  ];
}

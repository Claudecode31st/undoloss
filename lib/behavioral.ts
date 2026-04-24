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

  // Each warning type has its own color family so they're always visually distinct
  const panicColors =      { Low: 'text-emerald-600', Moderate: 'text-amber-600',  High: 'text-red-600'    };
  const overtradingColors = { Low: 'text-sky-600',     Moderate: 'text-blue-600',   High: 'text-blue-700'   };
  const overAvgColors =     { Low: 'text-violet-500',  Moderate: 'text-violet-600', High: 'text-violet-700' };

  return [
    {
      type: 'panic-selling',
      name: 'Panic Selling Risk',
      level: panicLevel,
      color: panicColors[panicLevel],
      icon: 'AlertTriangle',
    },
    {
      type: 'overtrading',
      name: 'Overtrading Risk',
      level: overtradingLevel,
      color: overtradingColors[overtradingLevel],
      icon: 'Zap',
    },
    {
      type: 'over-averaging',
      name: 'Over-Averaging Risk',
      level: overAvgLevel,
      color: overAvgColors[overAvgLevel],
      icon: 'Target',
    },
  ];
}

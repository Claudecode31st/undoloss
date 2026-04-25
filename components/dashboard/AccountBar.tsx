'use client';
import { Account, Position } from '@/lib/types';
import { calcEquity, fmtUSD, fmtUSDFull, fmtPct } from '@/lib/calculations';
import { AlertTriangle, TrendingDown, Wallet } from 'lucide-react';

interface Props {
  account: Account;
  positions: Position[];
}

export default function AccountBar({ account, positions }: Props) {
  const { equity, totalUnrealizedPnL, totalMarginUsed } = calcEquity(account, positions);
  const burnPct = account.walletBalance > 0
    ? ((account.walletBalance - equity) / account.walletBalance) * 100
    : 0;
  const equityPct = account.walletBalance > 0 ? (equity / account.walletBalance) * 100 : 0;

  const statusColor = equityPct < 15 ? '#ef4444' : equityPct < 30 ? '#f97316' : '#eab308';

  return (
    <div className="glass rounded-2xl p-4 mb-4">
      {/* Critical warning */}
      {equityPct < 20 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span className="font-semibold">Critical: Only {equityPct.toFixed(1)}% of wallet balance remains as equity</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Equity */}
        <div>
          <div className="text-[11px] t-3 mb-0.5 flex items-center gap-1">
            <Wallet size={11} /> Equity (Remaining)
          </div>
          <div className="text-2xl font-bold" style={{ color: statusColor }}>
            {fmtUSDFull(equity)}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: statusColor }}>
            {equityPct.toFixed(1)}% of wallet
          </div>
        </div>

        {/* Total unrealized */}
        <div>
          <div className="text-[11px] t-3 mb-0.5 flex items-center gap-1">
            <TrendingDown size={11} /> Unrealized Loss
          </div>
          <div className="text-xl font-bold text-red-500">
            {fmtUSD(totalUnrealizedPnL)}
          </div>
          <div className="text-[11px] t-3 mt-0.5">
            {fmtPct(burnPct)} of wallet burned
          </div>
        </div>

        {/* Wallet balance */}
        <div>
          <div className="text-[11px] t-3 mb-0.5">Wallet Balance</div>
          <div className="text-xl font-bold t-1">{fmtUSDFull(account.walletBalance)}</div>
          <div className="text-[11px] t-3 mt-0.5">Bybit wallet (USDT)</div>
        </div>

        {/* Margin used */}
        <div>
          <div className="text-[11px] t-3 mb-0.5">Margin Locked</div>
          <div className="text-xl font-bold t-1">{fmtUSD(totalMarginUsed)}</div>
          <div className="text-[11px] t-3 mt-0.5">
            Avail: {fmtUSDFull(account.availableBalance)}
          </div>
        </div>
      </div>

      {/* Equity burn bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] t-3 mb-1">
          <span>Wallet burned</span>
          <span>{burnPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, burnPct)}%`, background: 'linear-gradient(90deg, #f97316, #ef4444)' }} />
        </div>
        <div className="flex justify-between text-[10px] mt-0.5">
          <span className="text-emerald-500">$0</span>
          <span style={{ color: statusColor }}>{fmtUSD(equity)} left</span>
          <span className="t-3">{fmtUSD(account.walletBalance)}</span>
        </div>
      </div>
    </div>
  );
}

import { OHLCCandle } from './types';

const BASE = 'https://api.coingecko.com/api/v3';

// In-memory OHLC cache — daily candles don't change more than once per hour
const ohlcCache = new Map<string, { data: OHLCCandle[]; fetchedAt: number }>();
const OHLC_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch 180 days of daily OHLC candles for a CoinGecko coin ID.
 * Results are cached in memory for 1 hour to avoid hammering the free tier.
 */
export async function fetchOHLC(coinGeckoId: string, days = 180): Promise<OHLCCandle[]> {
  const cached = ohlcCache.get(coinGeckoId);
  if (cached && Date.now() - cached.fetchedAt < OHLC_TTL) return cached.data;

  const res = await fetch(
    `${BASE}/coins/${coinGeckoId}/ohlc?vs_currency=usd&days=${days}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`OHLC fetch failed for ${coinGeckoId}: ${res.status}`);

  const raw: number[][] = await res.json();
  const data: OHLCCandle[] = raw.map(([timestamp, open, high, low, close]) => ({
    timestamp, open, high, low, close,
  }));

  ohlcCache.set(coinGeckoId, { data, fetchedAt: Date.now() });
  return data;
}

export interface CoinPrice {
  id: string;
  usd: number;
  usd_24h_change: number;
}

export async function fetchPrices(coinIds: string[]): Promise<Record<string, CoinPrice>> {
  if (coinIds.length === 0) return {};
  const ids = coinIds.join(',');
  const res = await fetch(`${BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('CoinGecko fetch failed');
  const data = await res.json();

  const result: Record<string, CoinPrice> = {};
  for (const id of coinIds) {
    if (data[id]) {
      result[id] = {
        id,
        usd: data[id].usd,
        usd_24h_change: data[id].usd_24h_change ?? 0,
      };
    }
  }
  return result;
}

export async function searchCoins(query: string): Promise<Array<{ id: string; symbol: string; name: string }>> {
  if (!query || query.length < 2) return [];
  const res = await fetch(`${BASE}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.coins ?? []).slice(0, 10).map((c: { id: string; symbol: string; name: string }) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
  }));
}

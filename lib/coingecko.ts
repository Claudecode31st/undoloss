const BASE = 'https://api.coingecko.com/api/v3';

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

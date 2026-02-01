import { useQuery } from "@tanstack/react-query";

interface TokenMetrics {
  marketCap: number;
  ath: number;
  transactions: number;
  volume24h: number;
  traders: number;
  price: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h: number;
  liquidity: number;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
  };
  fdv?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
  };
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

// Fetch token metrics from DexScreener API
const fetchTokenMetrics = async (mint: string | null): Promise<TokenMetrics | null> => {
  if (!mint) return null;

  try {
    // DexScreener API endpoint for Solana tokens
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    
    if (!response.ok) {
      console.warn(`DexScreener API error for ${mint}:`, response.status);
      return null;
    }

    const data: DexScreenerResponse = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    // Get the pair with highest liquidity (usually the main pair)
    const mainPair = data.pairs.reduce((prev, current) => {
      const prevLiquidity = prev.liquidity?.usd || 0;
      const currentLiquidity = current.liquidity?.usd || 0;
      return currentLiquidity > prevLiquidity ? current : prev;
    });

    const price = parseFloat(mainPair.priceUsd) || 0;
    const fdv = mainPair.fdv || 0;
    const marketCap = fdv > 0 ? fdv : 0;
    const ath = marketCap; // Use market cap as ATH for now (could fetch historical)
    
    // Calculate total transactions
    const transactions = 
      (mainPair.txns.m5.buys + mainPair.txns.m5.sells) +
      (mainPair.txns.h1.buys + mainPair.txns.h1.sells) +
      (mainPair.txns.h6.buys + mainPair.txns.h6.sells) +
      (mainPair.txns.h24.buys + mainPair.txns.h24.sells);

    const volume24h = mainPair.volume.h24 || 0;
    const liquidity = mainPair.liquidity?.usd || 0;
    
    // Estimate traders (approximate from transaction count)
    const traders = Math.max(10, Math.floor(transactions / 3));

    // Price changes in percentage
    const priceChange5m = mainPair.priceChange.m5 || 0;
    const priceChange1h = mainPair.priceChange.h1 || 0;
    const priceChange6h = mainPair.priceChange.h6 || 0;
    const priceChange24h = mainPair.priceChange.h24 || 0;

    return {
      marketCap,
      ath,
      transactions,
      volume24h,
      traders,
      price,
      priceChange5m,
      priceChange1h,
      priceChange6h,
      priceChange24h,
      liquidity,
    };
  } catch (error) {
    console.error(`Error fetching metrics for ${mint}:`, error);
    return null;
  }
};

// Hook to fetch metrics for a single token
export const useTokenMetrics = (mint: string | null) => {
  return useQuery({
    queryKey: ["token-metrics", mint],
    queryFn: () => fetchTokenMetrics(mint),
    enabled: !!mint,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Hook to fetch metrics for multiple tokens
export const useMultipleTokenMetrics = (mints: (string | null)[]) => {
  return useQuery({
    queryKey: ["multiple-token-metrics", mints],
    queryFn: async () => {
      const results = await Promise.all(
        mints.map(mint => fetchTokenMetrics(mint))
      );
      
      // Create a map of mint -> metrics
      const metricsMap = new Map<string | null, TokenMetrics | null>();
      mints.forEach((mint, index) => {
        metricsMap.set(mint, results[index]);
      });
      
      return metricsMap;
    },
    enabled: mints.length > 0 && mints.some(m => !!m),
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

export type { TokenMetrics };


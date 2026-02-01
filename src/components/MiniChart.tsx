import { FC, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";

interface MiniChartProps {
  mint: string | null;
  isPositive?: boolean;
}

interface BirdeyePriceHistory {
  success: boolean;
  data: {
    items: Array<{
      unixTime: number;
      value: number;
    }>;
  };
}

// Fetch real price history from Birdeye API (Solana-focused)
const fetchPriceHistory = async (mint: string | null): Promise<number[]> => {
  if (!mint) return [];

  try {
    // Birdeye API for Solana token price history
    // Using their public API endpoint for price history
    const response = await fetch(
      `https://public-api.birdeye.so/v1/token/history_price?address=${mint}&type=1H&time_from=${Math.floor(Date.now() / 1000) - 86400}&time_to=${Math.floor(Date.now() / 1000)}`,
      {
        headers: {
          'X-API-KEY': '', // Birdeye has free tier, but may need API key for higher limits
        },
      }
    );

    if (!response.ok) {
      // Fallback to DexScreener if Birdeye fails
      return fetchDexScreenerFallback(mint);
    }

    const data: BirdeyePriceHistory = await response.json();
    
    if (data.success && data.data?.items && data.data.items.length > 0) {
      // Extract price values and return last 20 points
      const prices = data.data.items
        .map(item => item.value)
        .filter(price => price > 0);
      
      // Return last 20 points for sparkline
      return prices.slice(-20);
    }

    return fetchDexScreenerFallback(mint);
  } catch (error) {
    console.error(`Error fetching Birdeye price history for ${mint}:`, error);
    return fetchDexScreenerFallback(mint);
  }
};

// Fallback to DexScreener to generate sparkline from price changes
const fetchDexScreenerFallback = async (mint: string): Promise<number[]> => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }

    const mainPair = data.pairs[0];
    const currentPrice = parseFloat(mainPair.priceUsd) || 0;
    
    if (currentPrice === 0) return [];

    // Generate sparkline data points based on price change percentages
    const priceChange24h = mainPair.priceChange?.h24 || 0;
    const priceChange6h = mainPair.priceChange?.h6 || 0;
    const priceChange1h = mainPair.priceChange?.h1 || 0;
    const priceChange5m = mainPair.priceChange?.m5 || 0;
    
    const points = 20;
    const dataPoints: number[] = [];
    
    // Create realistic price movement based on available timeframes
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      
      // Weight different timeframes based on how far back we are
      let change = 0;
      if (progress < 0.25) {
        // Most recent: use 5m change
        change = priceChange5m * (1 - progress * 4);
      } else if (progress < 0.5) {
        // Recent: use 1h change
        change = priceChange1h * (1 - (progress - 0.25) * 4);
      } else if (progress < 0.75) {
        // Mid: use 6h change
        change = priceChange6h * (1 - (progress - 0.5) * 4);
      } else {
        // Old: use 24h change
        change = priceChange24h * (1 - (progress - 0.75) * 4);
      }
      
      dataPoints.push(currentPrice * (1 - change / 100));
    }

    return dataPoints;
  } catch (error) {
    console.error(`Error fetching DexScreener fallback for ${mint}:`, error);
    return [];
  }
};

export const MiniChart: FC<MiniChartProps> = ({ mint, isPositive = true }) => {
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ["price-history", mint],
    queryFn: () => fetchPriceHistory(mint),
    enabled: !!mint,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      // Return flat line if no data
      return Array.from({ length: 20 }, (_, i) => ({ value: 50, index: i }));
    }

    // Normalize data to 0-100 range for consistent chart height
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const range = max - min || 1;

    return priceHistory.map((price, index) => ({
      value: ((price - min) / range) * 100,
      index,
    }));
  }, [priceHistory]);

  const chartColor = isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))";

  if (isLoading || !priceHistory || priceHistory.length === 0) {
    return (
      <div className="h-8 w-16 bg-secondary rounded flex items-center justify-center">
        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-8 w-16 bg-secondary/30 rounded">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={`gradient-${mint}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={1.5}
            fill={`url(#gradient-${mint})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};


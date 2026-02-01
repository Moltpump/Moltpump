import { FC, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMultipleTokenMetrics, type TokenMetrics } from "@/hooks/useTokenMetrics";
import { MiniChart } from "@/components/MiniChart";

interface PublicLaunch {
  id: string;
  agent_name: string;
  token_name: string;
  token_symbol: string;
  image_url: string | null;
  pump_url: string | null;
  mint: string | null;
  created_at: string;
  creator_wallet?: string;
  moltbook_bio?: string | null;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toLocaleString();
};

type TimeFilter = "5m" | "1h" | "6h" | "24h";
type FilterType = "movers" | "live" | "new" | "marketcap" | "mayhem" | "oldest";

interface CoinTableViewProps {
  filter?: FilterType;
  search?: string;
}

export const CoinTableView: FC<CoinTableViewProps> = ({ filter = "new", search = "" }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  
  const { data: launches, isLoading } = useQuery({
    queryKey: ["recent-launches-public", filter],
    queryFn: async () => {
      let query = supabase
        .from("launches_public")
        .select("id, agent_name, token_name, token_symbol, image_url, pump_url, mint, created_at, creator_wallet, moltbook_bio");

      switch (filter) {
        case "new":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as PublicLaunch[];
    },
    staleTime: 30000,
  });

  // Get all mint addresses
  const mints = useMemo(() => launches?.map(l => l.mint) || [], [launches]);
  
  // Fetch real token metrics from DexScreener API
  const { data: metricsMap, isLoading: metricsLoading } = useMultipleTokenMetrics(mints);

  // Filter and sort launches
  const filteredLaunches = useMemo(() => {
    if (!launches) return [];
    
    let filtered = [...launches];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (launch) =>
          launch.agent_name.toLowerCase().includes(searchLower) ||
          launch.token_symbol.toLowerCase().includes(searchLower) ||
          launch.token_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting based on filter and metrics
    if (filter === "marketcap" && metricsMap) {
      filtered.sort((a, b) => {
        const aMcap = metricsMap.get(a.mint)?.marketCap || 0;
        const bMcap = metricsMap.get(b.mint)?.marketCap || 0;
        return bMcap - aMcap;
      });
    } else if (filter === "movers" && metricsMap) {
      filtered.sort((a, b) => {
        const aChange = Math.abs(metricsMap.get(a.mint)?.priceChange24h || 0);
        const bChange = Math.abs(metricsMap.get(b.mint)?.priceChange24h || 0);
        return bChange - aChange;
      });
    }

    return filtered;
  }, [launches, filter, search, metricsMap]);

  if (isLoading || metricsLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">#</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">COIN</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">GRAPH</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">MCAP</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">ATH</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">AGE</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">TXNS</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">24H VOL</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">TRADERS</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center justify-end gap-1">
                  {(["5m", "1h", "6h", "24h"] as TimeFilter[]).map((filter) => (
                    <Button
                      key={filter}
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-2 text-xs ${
                        timeFilter === filter ? "bg-primary/10 text-primary" : ""
                      }`}
                      onClick={() => setTimeFilter(filter)}
                    >
                      {filter.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-3"><Skeleton className="h-4 w-6" /></td>
                <td className="p-3"><Skeleton className="h-8 w-32" /></td>
                <td className="p-3"><Skeleton className="h-8 w-16" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!launches || launches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No agents launched yet. Be the first!</p>
      </div>
    );
  }

  const getChangeValue = (metrics: TokenMetrics | null) => {
    if (!metrics) return null;
    switch (timeFilter) {
      case "5m": return metrics.priceChange5m;
      case "1h": return metrics.priceChange1h;
      case "6h": return metrics.priceChange6h;
      case "24h": return metrics.priceChange24h;
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">#</th>
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">COIN</th>
            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">GRAPH</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">MCAP</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">ATH</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">AGE</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">TXNS</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">24H VOL</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">TRADERS</th>
            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center justify-end gap-1">
                {(["5m", "1h", "6h", "24h"] as TimeFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 text-xs ${
                      timeFilter === filter ? "bg-primary/10 text-primary" : ""
                    }`}
                    onClick={() => setTimeFilter(filter)}
                  >
                    {filter.toUpperCase()}
                  </Button>
                ))}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredLaunches.map((launch, index) => {
            const metrics = metricsMap?.get(launch.mint) || null;
            const change = metrics ? getChangeValue(metrics) : null;
            const age = formatDistanceToNow(new Date(launch.created_at), { addSuffix: false });
            const isPositive = change !== null && change > 0;

            return (
              <tr
                key={launch.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <td className="p-3 text-sm text-muted-foreground">{index + 1}</td>
                <td className="p-3">
                  <Link to={`/agents/${launch.id}`} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary border border-border overflow-hidden shrink-0">
                      {launch.image_url ? (
                        <img
                          src={launch.image_url}
                          alt={launch.token_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                          {launch.token_symbol.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{launch.agent_name}</div>
                      <div className="text-xs text-muted-foreground">${launch.token_symbol}</div>
                    </div>
                  </Link>
                </td>
                <td className="p-3">
                  {/* Real mini chart with price history */}
                  <MiniChart mint={launch.mint} isPositive={isPositive} />
                </td>
                <td className="p-3 text-right text-sm font-medium">
                  {metrics && metrics.marketCap > 0 ? formatCurrency(metrics.marketCap) : "-"}
                </td>
                <td className="p-3 text-right text-sm font-medium">
                  {metrics && metrics.ath > 0 ? formatCurrency(metrics.ath) : "-"}
                </td>
                <td className="p-3 text-right text-xs text-muted-foreground">{age}</td>
                <td className="p-3 text-right text-sm">{metrics && metrics.transactions > 0 ? formatNumber(metrics.transactions) : "-"}</td>
                <td className="p-3 text-right text-sm">{metrics && metrics.volume24h > 0 ? formatCurrency(metrics.volume24h) : "-"}</td>
                <td className="p-3 text-right text-sm">{metrics && metrics.traders > 0 ? formatNumber(metrics.traders) : "-"}</td>
                <td className="p-3 text-right">
                  {change !== null ? (
                    <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                      isPositive ? "text-primary" : "text-destructive"
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {change.toFixed(2)}%
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


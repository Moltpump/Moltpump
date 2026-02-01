import { FC, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMultipleTokenMetrics } from "@/hooks/useTokenMetrics";
import { MiniChart } from "@/components/MiniChart";
import { TrendingUp, TrendingDown } from "lucide-react";

type FilterType = "movers" | "live" | "new" | "marketcap" | "mayhem" | "oldest";

interface RecentLaunchesProps {
  filter?: FilterType;
  search?: string;
}

interface PublicLaunch {
  id: string;
  creator_wallet: string;
  agent_name: string;
  token_name: string;
  token_symbol: string;
  image_url: string | null;
  pump_url: string | null;
  mint: string | null;
  created_at: string;
  moltbook_bio: string | null;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const RecentLaunches: FC<RecentLaunchesProps> = ({ filter = "new", search = "" }) => {
  const { data: launches, isLoading } = useQuery({
    queryKey: ["recent-launches-public", filter],
    queryFn: async () => {
      let query = supabase
        .from("launches_public")
        .select("id, creator_wallet, agent_name, token_name, token_symbol, image_url, pump_url, mint, created_at, moltbook_bio");

      // Apply sorting based on filter
      switch (filter) {
        case "new":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "marketcap":
          // Will sort by market cap after fetching metrics
          query = query.order("created_at", { ascending: false });
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

  // Get all mint addresses for metrics
  const mints = useMemo(() => launches?.map(l => l.mint) || [], [launches]);
  const { data: metricsMap } = useMultipleTokenMetrics(mints);

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

    return filtered.slice(0, 20);
  }, [launches, filter, search, metricsMap]);

  if (isLoading) {
    return (
      <section className="w-full">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!launches || launches.length === 0) {
    return (
      <section className="w-full">
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No agents launched yet. Be the first!</p>
            <Button asChild className="btn-primary-glow">
              <Link to="/launch">Launch Now</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full">
      {/* Launchpad style grid - Compact cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredLaunches.map((launch) => {
          const timeAgo = formatDistanceToNow(new Date(launch.created_at), { addSuffix: true });
          const shortTime = timeAgo.replace(' ago', '').replace('about ', '');
          const metrics = metricsMap?.get(launch.mint) || null;
          const priceChange = metrics?.priceChange24h || 0;
          const isPositive = priceChange > 0;
          
          return (
            <Link key={launch.id} to={`/agents/${launch.id}`} className="block">
              <Card className="border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card cursor-pointer group transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-4">
                  {/* Header: Image + Name + Symbol */}
                  <div className="flex items-start gap-3 mb-3">
                  {/* Token Image */}
                    <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-secondary border border-border/50">
                    {launch.image_url ? (
                      <img
                        src={launch.image_url}
                        alt={launch.token_name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground bg-gradient-to-br from-secondary to-secondary/50">
                          {launch.token_symbol?.slice(0, 2).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>

                    {/* Name and Symbol */}
                  <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors mb-0.5">
                        {launch.agent_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold">${launch.token_symbol}</span>
                        <span>•</span>
                        <span>{shortTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Market Cap */}
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Market Cap</div>
                      <div className="text-sm font-bold text-foreground">
                        {metrics && metrics.marketCap > 0 ? formatCurrency(metrics.marketCap) : "-"}
                      </div>
                    </div>

                    {/* Price Change */}
                    <div className={`rounded-lg p-2 ${
                      isPositive ? 'bg-primary/10' : priceChange < 0 ? 'bg-destructive/10' : 'bg-secondary/30'
                    }`}>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">24h Change</div>
                      <div className={`text-sm font-bold flex items-center gap-1 ${
                        isPositive ? 'text-primary' : priceChange < 0 ? 'text-destructive' : 'text-foreground'
                      }`}>
                        {priceChange !== 0 && (
                          <>
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {isPositive ? '+' : ''}
                            {priceChange.toFixed(2)}%
                          </>
                        )}
                        {priceChange === 0 && <span>-</span>}
                      </div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-border/30">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>Creator</span>
                    </div>
                    <code className="font-mono text-foreground bg-secondary/50 px-2 py-0.5 rounded">
                      {truncateAddress(launch.creator_wallet)}
                    </code>
                  </div>

                  {/* Mini Chart */}
                  {launch.mint && (
                    <div className="h-10">
                      <MiniChart mint={launch.mint} isPositive={isPositive} />
                    </div>
                  )}
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>
    </section>
  );
};

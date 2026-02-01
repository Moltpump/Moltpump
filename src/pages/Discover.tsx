import { FC, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLaunches } from "@/hooks/useLaunches";
import { useMultipleTokenMetrics } from "@/hooks/useTokenMetrics";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/CopyButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  ExternalLink,
  Zap,
  Trophy,
  Radio,
  Filter,
  Flame,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PublicLaunch } from "@/hooks/useLaunches";

type FilterValue = "all" | string;

interface ColumnFilters {
  maxAge: FilterValue;
  marketCap: FilterValue;
  tokenomicsProgress: FilterValue;
}

const DiscoverPage: FC = () => {
  const { data: launches, isLoading } = useLaunches();
  
  // Get all mint addresses for metrics
  const mints = useMemo(() => launches?.map(l => l.mint) || [], [launches]);
  const { data: metricsMap } = useMultipleTokenMetrics(mints);
  const [searchNew, setSearchNew] = useState("");
  const [searchFinal, setSearchFinal] = useState("");
  const [searchTokenomics, setSearchTokenomics] = useState("");
  const [filtersNew, setFiltersNew] = useState<ColumnFilters>({
    maxAge: "all",
    marketCap: "all",
    tokenomicsProgress: "all",
  });
  const [filtersFinal, setFiltersFinal] = useState<ColumnFilters>({
    maxAge: "all",
    marketCap: "all",
    tokenomicsProgress: "all",
  });
  const [filtersTokenomics, setFiltersTokenomics] = useState<ColumnFilters>({
    maxAge: "all",
    marketCap: "all",
    tokenomicsProgress: "all",
  });

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDaysAgo = (date: string) => {
    const days = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getMarketCap = (launch: PublicLaunch) => {
    const metrics = metricsMap?.get(launch.mint || "");
    if (!metrics || !metrics.marketCap) return null;
    return metrics.marketCap;
  };

  const getTokenomicsProgress = (launch: PublicLaunch) => {
    // Mock progress calculation - you can replace with real data
    const metrics = metricsMap?.get(launch.mint || "");
    if (!metrics) return { lightning: 0, fire: 0, money: 0 };
    
    // Mock percentages based on market cap
    const marketCap = metrics.marketCap || 0;
    const progress = Math.min((marketCap / 30000) * 100, 100);
    
    return {
      lightning: Math.floor(progress * 0.4),
      fire: Math.floor(progress * 0.35),
      money: Math.floor(progress * 0.25),
    };
  };

  // Filter launches for "New Pairs" (recent, low market cap)
  const newPairs = useMemo(() => {
    if (!launches) return [];
    let filtered = launches.filter((launch) => {
      const days = getDaysAgo(launch.created_at);
      const marketCap = getMarketCap(launch);
      
      // New pairs: less than 7 days old, market cap < 10k
      if (days > 7) return false;
      if (marketCap && marketCap > 10000) return false;
      
      if (searchNew) {
        const searchLower = searchNew.toLowerCase();
        if (
          !launch.agent_name.toLowerCase().includes(searchLower) &&
          !launch.token_symbol.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      
      if (filtersNew.maxAge !== "all") {
        const maxDays = parseInt(filtersNew.maxAge);
        if (days > maxDays) return false;
      }
      
      if (filtersNew.marketCap !== "all") {
        const maxCap = parseInt(filtersNew.marketCap);
        if (marketCap && marketCap > maxCap) return false;
      }
      
      return true;
    });
    
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [launches, searchNew, filtersNew, metricsMap]);

  // Filter launches for "Final Stretch" (approaching goal)
  const finalStretch = useMemo(() => {
    if (!launches) return [];
    let filtered = launches.filter((launch) => {
      const marketCap = getMarketCap(launch);
      if (!marketCap) return false;
      
      // Final stretch: market cap between 10k and 30k
      if (marketCap < 10000 || marketCap > 30000) return false;
      
      if (searchFinal) {
        const searchLower = searchFinal.toLowerCase();
        if (
          !launch.agent_name.toLowerCase().includes(searchLower) &&
          !launch.token_symbol.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered.sort((a, b) => {
      const capA = getMarketCap(a) || 0;
      const capB = getMarketCap(b) || 0;
      return capB - capA;
    });
  }, [launches, searchFinal, metricsMap]);

  // Filter launches for "Tokenomics Live" (active tokenomics)
  const tokenomicsLive = useMemo(() => {
    if (!launches) return [];
    let filtered = launches.filter((launch) => {
      const marketCap = getMarketCap(launch);
      if (!marketCap) return false;
      
      // Tokenomics live: market cap > 30k
      if (marketCap < 30000) return false;
      
      if (searchTokenomics) {
        const searchLower = searchTokenomics.toLowerCase();
        if (
          !launch.agent_name.toLowerCase().includes(searchLower) &&
          !launch.token_symbol.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered.sort((a, b) => {
      const capA = getMarketCap(a) || 0;
      const capB = getMarketCap(b) || 0;
      return capB - capA;
    });
  }, [launches, searchTokenomics, metricsMap]);

  const TokenCard = ({ launch, showTokenomics }: { launch: PublicLaunch; showTokenomics?: boolean }) => {
    const days = getDaysAgo(launch.created_at);
    const marketCap = getMarketCap(launch);
    const progress = getTokenomicsProgress(launch);
    const timeAgo = formatDistanceToNow(new Date(launch.created_at), { addSuffix: true });
    const shortTime = timeAgo.replace(' ago', '').replace('about ', '');

    return (
      <Link to={`/agents/${launch.id}`}>
        <Card className="border-border bg-card hover:border-primary/30 cursor-pointer group transition-all duration-200 mb-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                {launch.image_url ? (
                  <img
                    src={launch.image_url}
                    alt={launch.agent_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                    {launch.token_symbol.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-semibold text-sm truncate text-foreground">
                    {launch.agent_name}
                  </h3>
                  {launch.moltbook_verified && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs px-1.5 py-0">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>${launch.token_symbol}</span>
                  <span>•</span>
                  <span>{days}d</span>
                </div>
              </div>
            </div>

            {launch.mint && (
              <div className="flex items-center gap-1 mb-2">
                <code className="text-[10px] text-muted-foreground font-mono">
                  {truncateAddress(launch.mint)}
                </code>
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyButton
                    value={launch.mint}
                    label="Mint"
                    size="icon"
                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            )}

            {showTokenomics && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Zap className="h-3 w-3" />
                  <span>{progress.lightning}%</span>
                  <Flame className="h-3 w-3 ml-2" />
                  <span>{progress.fire}%</span>
                  <DollarSign className="h-3 w-3 ml-2" />
                  <span>{progress.money}%</span>
                </div>
              </div>
            )}

            {marketCap && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">MC</span>
                  <span className="font-semibold">${(marketCap / 1000).toFixed(1)}K</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((marketCap / 30000) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>${(marketCap / 1000).toFixed(1)}K</span>
                  <span>$30K</span>
                </div>
              </div>
            )}

            {showTokenomics && (
              <div className="flex items-center gap-1 text-xs text-primary mb-2">
                <Radio className="h-3 w-3" />
                <span>Tokenomics Active</span>
              </div>
            )}

            {launch.pump_url && (
              <a
                href={launch.pump_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                View on Pump.fun
              </a>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  const FilterPopover = ({
    filters,
    onFiltersChange,
  }: {
    filters: ColumnFilters;
    onFiltersChange: (filters: ColumnFilters) => void;
  }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Filter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-2 block">Max Age</label>
              <Select
                value={filters.maxAge}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, maxAge: value })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block">Market Cap</label>
              <Select
                value={filters.marketCap}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, marketCap: value })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1000">Under $1K</SelectItem>
                  <SelectItem value="5000">Under $5K</SelectItem>
                  <SelectItem value="10000">Under $10K</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block">Tokenomics Progress</label>
              <Select
                value={filters.tokenomicsProgress}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, tokenomicsProgress: value })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0-25">0-25%</SelectItem>
                  <SelectItem value="25-50">25-50%</SelectItem>
                  <SelectItem value="50-75">50-75%</SelectItem>
                  <SelectItem value="75-100">75-100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const Column = ({
    title,
    icon: Icon,
    search,
    onSearchChange,
    launches,
    filters,
    onFiltersChange,
    showTokenomics = false,
  }: {
    title: string;
    icon: any;
    search: string;
    onSearchChange: (value: string) => void;
    launches: PublicLaunch[];
    filters: ColumnFilters;
    onFiltersChange: (filters: ColumnFilters) => void;
    showTokenomics?: boolean;
  }) => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">{title}</h2>
          </div>
          <FilterPopover filters={filters} onFiltersChange={onFiltersChange} />
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : launches.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No items found
            </div>
          ) : (
            launches.map((launch) => (
              <TokenCard key={launch.id} launch={launch} showTokenomics={showTokenomics} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <Column
            title="New Pairs"
            icon={Zap}
            search={searchNew}
            onSearchChange={setSearchNew}
            launches={newPairs}
            filters={filtersNew}
            onFiltersChange={setFiltersNew}
          />
          <Column
            title="Final Stretch"
            icon={Trophy}
            search={searchFinal}
            onSearchChange={setSearchFinal}
            launches={finalStretch}
            filters={filtersFinal}
            onFiltersChange={setFiltersFinal}
          />
          <Column
            title="Tokenomics Live"
            icon={Radio}
            search={searchTokenomics}
            onSearchChange={setSearchTokenomics}
            launches={tokenomicsLive}
            filters={filtersTokenomics}
            onFiltersChange={setFiltersTokenomics}
            showTokenomics={true}
          />
        </div>
      </div>
  );
};

export default DiscoverPage;

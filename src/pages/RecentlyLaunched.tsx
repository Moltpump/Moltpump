import { FC, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLaunches } from "@/hooks/useLaunches";
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
  Search,
  ExternalLink,
  Flame,
  CheckCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

const ITEMS_PER_PAGE = 12;

const RecentlyLaunchedPage: FC = () => {
  const { data: launches, isLoading, error } = useLaunches();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Filter and sort launches
  const filteredLaunches = useMemo(() => {
    if (!launches) return [];
    const searchLower = search.toLowerCase();
    
    // Filter
    let filtered = launches.filter((launch) =>
      launch.agent_name.toLowerCase().includes(searchLower) ||
      launch.token_symbol.toLowerCase().includes(searchLower) ||
      launch.token_name.toLowerCase().includes(searchLower)
    );
    
    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "name_asc":
        filtered.sort((a, b) => a.agent_name.localeCompare(b.agent_name));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.agent_name.localeCompare(a.agent_name));
        break;
    }
    
    return filtered;
  }, [launches, search, sortBy]);

  // Paginate
  const totalPages = Math.ceil(filteredLaunches.length / ITEMS_PER_PAGE);
  const paginatedLaunches = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredLaunches.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLaunches, page]);

  // Reset page when search or sort changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Search Bar - Simple Container */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">⌘ K</span>
          </div>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-44">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
              <SelectItem value="name_desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 space-y-6 min-h-0">

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(12)].map((_, i) => (
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
      )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">Failed to load agents. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredLaunches.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-12 text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Agents Found</h3>
              <p className="mt-1 text-muted-foreground">
                {search
                  ? "Try adjusting your search"
                  : "Be the first to launch an agent!"}
              </p>
              {!search && (
                <Button asChild className="mt-4">
                  <Link to="/launch">Launch Agent</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Agent Cards Grid - Pump.fun style */}
        {!isLoading && paginatedLaunches.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedLaunches.map((launch) => {
            const timeAgo = formatDistanceToNow(new Date(launch.created_at), { addSuffix: true });
            const shortTime = timeAgo.replace(' ago', '').replace('about ', '');
            
            return (
              <Link key={launch.id} to={`/agents/${launch.id}`}>
                <Card className="border-border bg-card hover:border-primary/30 cursor-pointer group transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Token Image - Pump.fun style rounded square */}
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

                      {/* Info - Pump.fun style */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="font-semibold text-sm truncate text-foreground">
                            {launch.agent_name}
                          </h3>
                          {launch.moltbook_verified && (
                            <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            ${launch.token_symbol}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {shortTime}
                          </span>
                        </div>
                        {launch.mint && (
                          <div className="flex items-center gap-1 mt-1">
                            <code className="text-[10px] text-muted-foreground font-mono truncate">
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
                      </div>
                    </div>
                    
                    {/* Pump.fun link */}
                    {launch.pump_url && (
                      <a
                        href={launch.pump_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on Pump.fun
                      </a>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyLaunchedPage;

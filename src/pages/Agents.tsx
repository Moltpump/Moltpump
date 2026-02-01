import { FC, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Bot,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Wallet,
  Rocket,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Launch } from "@/types/launch";

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

const ITEMS_PER_PAGE = 12;

const AgentsPage: FC = () => {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Fetch only launches by the connected wallet
  const { data: launches, isLoading, error } = useQuery({
    queryKey: ["my-launches", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return [];
      
      const { data, error } = await supabase
        .from("launches")
        .select("*")
        .eq("creator_wallet", publicKey.toBase58())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Launch[];
    },
    enabled: !!publicKey,
  });

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

  // Not connected state
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Card className="border-border bg-card text-center max-w-md w-full">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your launched agents
            </p>
            <Button onClick={() => setVisible(true)} className="gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            My Agents
          </h1>
          <p className="mt-1 text-muted-foreground">
            {filteredLaunches.length} agent{filteredLaunches.length !== 1 ? "s" : ""} you've launched
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-secondary border-border pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-44 bg-secondary border-border">
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

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
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
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-border bg-card max-w-md w-full">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Agents Found</h3>
              <p className="text-muted-foreground mb-6">
                {search
                  ? "Try adjusting your search terms"
                  : "Be the first to launch an agent!"}
              </p>
              {!search && (
                <Button asChild className="gap-2 btn-primary-glow" size="lg">
                  <Link to="/launch">
                    <Rocket className="h-4 w-4" />
                    Launch Agent
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Cards Grid */}
      {!isLoading && paginatedLaunches.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedLaunches.map((launch) => (
            <Link key={launch.id} to={`/agents/${launch.id}`}>
              <Card className="border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {launch.image_url ? (
                        <img
                          src={launch.image_url}
                          alt={launch.agent_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Bot className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">
                          {launch.agent_name}
                        </h3>
                        {launch.moltbook_verified && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 bg-primary/20 text-primary"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${launch.token_symbol}
                      </p>

                      {/* Mint Address */}
                      {launch.mint && (
                        <div className="mt-2 flex items-center gap-1">
                          <code className="text-xs text-muted-foreground font-mono">
                            {truncateAddress(launch.mint)}
                          </code>
                          <CopyButton
                            value={launch.mint}
                            label="Mint"
                            size="icon"
                            className="h-6 w-6"
                          />
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(launch.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {launch.pump_url && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(launch.pump_url!, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Pump.fun
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
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
  );
};

export default AgentsPage;

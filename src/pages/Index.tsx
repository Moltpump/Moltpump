import { useState, useMemo } from "react";
import { RecentLaunches } from "@/components/RecentLaunches";
import { CoinTableView } from "@/components/CoinTableView";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid3x3, List, Settings, Star, Radio, Leaf, DollarSign, Flame, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type FilterType = "movers" | "live" | "new" | "marketcap" | "mayhem" | "oldest";

const Index = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<FilterType>("new");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
        {/* Search Bar & Filters - Simple Container */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex flex-col gap-1.5">
            {/* Search Bar */}
            <div className="flex items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  className="pl-10 pr-8 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">⌘ K</span>
              </div>
            </div>

            {/* Filters/Tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className={`shrink-0 h-8 px-2.5 ${activeFilter === "movers" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveFilter("movers")}
              >
                <Star className="h-3 w-3 mr-1" />
                Movers
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`shrink-0 h-8 px-2.5 ${activeFilter === "live" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveFilter("live")}
              >
                <Radio className="h-3 w-3 mr-1" />
                Live
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`shrink-0 h-8 px-2.5 ${activeFilter === "new" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveFilter("new")}
              >
                <Leaf className="h-3 w-3 mr-1" />
                New
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`shrink-0 h-8 px-2.5 ${activeFilter === "marketcap" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveFilter("marketcap")}
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Market cap
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`shrink-0 h-8 px-2.5 ${activeFilter === "mayhem" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveFilter("mayhem")}
              >
                <Flame className="h-3 w-3 mr-1" />
                Mayhem
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`shrink-0 h-8 px-2.5 ${activeFilter === "oldest" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveFilter("oldest")}
              >
                <Hourglass className="h-3 w-3 mr-1" />
                Oldest
              </Button>
              </div>
              <div className="flex items-center gap-1 shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "list" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Toggle between Grid and List */}
        <div className="flex-1 px-4 py-3 min-h-0">
          {viewMode === "list" ? (
            <CoinTableView filter={activeFilter} search={searchQuery} />
          ) : (
            <RecentLaunches filter={activeFilter} search={searchQuery} />
          )}
        </div>
      </div>
  );
};

export default Index;

import { FC } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, Flame, Bot, Zap, DollarSign, Users, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const RightSidebar: FC = () => {
  // Fetch platform stats
  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { count: totalLaunches } = await supabase
        .from("launches_public")
        .select("*", { count: "exact", head: true });
      
      const { count: recentLaunches } = await supabase
        .from("launches_public")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return {
        totalLaunches: totalLaunches || 0,
        recentLaunches: recentLaunches || 0,
      };
    },
    staleTime: 60000,
  });

  // Fetch latest launches for trending
  const { data: latestLaunches } = useQuery({
    queryKey: ["latest-launches-sidebar"],
    queryFn: async () => {
      const { data } = await supabase
        .from("launches_public")
        .select("id, agent_name, token_symbol, created_at, image_url")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 30000,
  });

  return (
    <aside className="w-80 shrink-0 hidden xl:block border-l border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="p-4 space-y-0">
          {/* Platform Stats */}
          <Card className="border-x-0 border-t-0 border-b border-border/50 rounded-none bg-card/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Platform Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Launches</span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {stats?.totalLaunches.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">24h Launches</span>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                  {stats?.recentLaunches || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Trending Launches */}
          <Card className="border-x-0 border-t-0 border-b border-border/50 rounded-none bg-card/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Latest Launches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {latestLaunches && latestLaunches.length > 0 ? (
                latestLaunches.map((launch, index) => (
                  <Link
                    key={launch.id}
                    to={`/agents/${launch.id}`}
                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group border border-transparent hover:border-border/30 ${
                      index < latestLaunches.length - 1 ? 'border-b border-border/20' : ''
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-secondary border border-border/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {launch.image_url ? (
                        <img
                          src={launch.image_url}
                          alt={launch.agent_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          {launch.token_symbol?.slice(0, 2).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {launch.agent_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(launch.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border border-border/30 rounded-lg">
                  No launches yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-x-0 border-t-0 border-b border-border/50 rounded-none bg-card/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Link
                to="/launch"
                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:from-primary/20 hover:to-primary/10 transition-all group"
              >
                <Rocket className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-sm">Launch Agent</div>
                  <div className="text-xs text-muted-foreground">Create & deploy</div>
                </div>
              </Link>
              <Link
                to="/agents"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group border border-transparent hover:border-border/30"
              >
                <Bot className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-semibold text-sm">My Agents</div>
                  <div className="text-xs text-muted-foreground">Manage your agents</div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-x-0 border-t-0 border-b-0 rounded-none bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-sm">Moltpump</div>
                  <div className="text-xs text-muted-foreground">AI Agent Launchpad</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                Launch AI agents with Solana tokens. Powered by Pump.fun & Moltbook integration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
};


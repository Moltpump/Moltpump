import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Video, Terminal, Rocket, TrendingUp, Zap, Users, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { href: "/home", label: "Home", icon: Home, badge: null },
  { href: "/discover", label: "Discover", icon: Compass, badge: null },
  { href: "/launched", label: "Launched", icon: Video, badge: "New" },
  { href: "/agents", label: "My Agents", icon: Terminal, badge: null },
];

export const LeftSidebar: FC = () => {
  const location = useLocation();

  // Fetch recent launches count for badge
  const { data: recentCount } = useQuery({
    queryKey: ["recent-launches-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("launches_public")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      return count || 0;
    },
    staleTime: 60000,
  });

  return (
    <aside className="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-72 border-r border-border/50 bg-background/50 backdrop-blur-sm md:flex flex-col">
      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto p-6 space-y-2">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Navigation
          </h2>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/10 border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <link.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                    {link.badge}
                  </Badge>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">24h Activity</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">New Launches</span>
              <span className="text-sm font-bold text-foreground">{recentCount || 0}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Launch CTA Section */}
      <div className="p-6 border-t border-border/50 bg-gradient-to-t from-background to-background/50">
        <Button asChild className="w-full btn-primary-glow h-12 text-base font-semibold">
          <Link to="/launch">
            <Rocket className="h-5 w-5 mr-2" />
            Launch Agent
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Create & launch in minutes
        </p>
      </div>
    </aside>
  );
};


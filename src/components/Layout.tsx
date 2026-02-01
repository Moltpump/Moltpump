import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { WalletConnection } from "./WalletConnection";
import { Button } from "@/components/ui/button";
import { LeftSidebar } from "./LeftSidebar";
import { Rocket, Menu, X } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import logoSvg from "@/assets/logo.svg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
}

export const Layout = ({ children }: Props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch stats for header
  const { data: stats } = useQuery({
    queryKey: ["launch-stats"],
    queryFn: async () => {
      const { count } = await supabase
        .from("launches_public")
        .select("*", { count: "exact", head: true });
      return { totalLaunches: count || 0 };
    },
    staleTime: 60000, // 1 minute
  });

  return (
    <div className="min-h-screen bg-background">
        {/* Header - Unique Launchpad Style */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-20 items-center justify-between px-4 lg:px-6">
            {/* Logo - Always Visible */}
            <div className="flex items-center gap-6">
              <Link to="/home" className="flex items-center group">
                <div className="relative">
                  <img src={logoSvg} alt="Moltpump" className="h-16 w-16 sm:h-24 sm:w-24 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
          </Link>

              {/* Stats Bar - Desktop Only */}
              <div className="hidden lg:flex items-center gap-6 pl-6 border-l border-border/50">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Total Launches</span>
                  <span className="text-lg font-bold text-foreground">
                    {stats?.totalLaunches.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Platform</span>
                  <span className="text-sm font-semibold text-primary">Solana</span>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* CA Token Display - Desktop Only */}
              {import.meta.env.VITE_CA_TOKEN && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
                  <span className="text-xs text-muted-foreground">CA:</span>
                  <code className="text-xs font-mono text-foreground max-w-[120px] truncate">
                    {import.meta.env.VITE_CA_TOKEN}
                  </code>
                  <CopyButton 
                    value={import.meta.env.VITE_CA_TOKEN} 
                    label="CA Token"
                    size="icon"
                    className="h-5 w-5"
                  />
                </div>
              )}

              {/* Social Links - Desktop Only */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-12 w-12"
                >
                  <a
                    href="https://twitter.com/moltpump1"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <img 
                      src="https://www.freepnglogos.com/x-logo-png-twitter-0.jpg" 
                      alt="Twitter" 
                      className="h-8 w-8 object-contain"
                    />
                  </a>
                </Button>
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Launch Button - Prominent */}
              <Button asChild className="btn-primary-glow hidden sm:flex">
                <Link to="/launch">
                  <Rocket className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Launch Agent</span>
                  <span className="lg:hidden">Launch</span>
                </Link>
              </Button>
              
            <WalletConnection />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-4 space-y-2">
              {/* CA Token - Mobile */}
              {import.meta.env.VITE_CA_TOKEN && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 mb-2">
                  <span className="text-xs text-muted-foreground">CA:</span>
                  <code className="text-xs font-mono text-foreground flex-1 truncate">
                    {import.meta.env.VITE_CA_TOKEN}
                  </code>
                  <CopyButton 
                    value={import.meta.env.VITE_CA_TOKEN} 
                    label="CA Token"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                  />
                </div>
              )}
              
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/home" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/discover" onClick={() => setMobileMenuOpen(false)}>Discover</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/launched" onClick={() => setMobileMenuOpen(false)}>Recently Launched</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/agents" onClick={() => setMobileMenuOpen(false)}>My Agents</Link>
              </Button>
              <Button asChild className="w-full btn-primary-glow mt-4">
                <Link to="/launch" onClick={() => setMobileMenuOpen(false)}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Launch Agent
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Layout with Sidebars */}
      <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-72 min-h-0 overflow-y-auto flex flex-col h-full">
          {children}
        </main>
      </div>
    </div>
  );
};

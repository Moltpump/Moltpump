import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { WalletProvider } from "@/components/WalletProvider";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Launch from "./pages/Launch";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import RecentlyLaunched from "./pages/RecentlyLaunched";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/launch" element={<Launch />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/agents/:id" element={<AgentDetail />} />
                <Route path="/launched" element={<RecentlyLaunched />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

import { FC, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLaunchPublic, useLaunch } from "@/hooks/useLaunches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Bot,
  Coins,
  FileText,
  ExternalLink,
  Globe,
  Twitter,
  Send,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Lock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { OpenClawPack } from "@/components/launch/OpenClawPack";
import { RuntimeSettingsEditor } from "@/components/launch/RuntimeSettingsEditor";
import { Launch } from "@/types/launch";
import { motion } from "framer-motion";
import logoSvg from "@/assets/logo.svg";

const AgentDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  
  // Public data (for all viewers)
  const { data: publicLaunch, isLoading: publicLoading, error: publicError } = useLaunchPublic(id);
  
  // Full data including secrets (only fetched if wallet connected)
  const { data: fullLaunch } = useLaunch(id);
  
  const [promptOpen, setPromptOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const queryClient = useQueryClient();

  // Check if current user is the creator
  const isCreator = publicKey && publicLaunch && publicKey.toBase58() === publicLaunch.creator_wallet;
  
  // Use full launch data if creator, otherwise public data
  const launch = isCreator && fullLaunch ? fullLaunch : publicLaunch;

  const truncateAddress = (address: string, start = 6, end = 4) => {
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  // Retry Moltbook registration
  const handleRetryMoltbook = async () => {
    if (!launch) return;
    
    setRetrying(true);
    try {
      const description = `${launch.personality}\n\nToken: ${launch.token_name} (${launch.token_symbol})\nPump.fun: ${launch.pump_url}`;
      
      const { data, error: fnError } = await supabase.functions.invoke("moltbook-register", {
        body: {
          agentName: launch.agent_name,
          description,
        },
      });

      if (fnError) throw fnError;

      if (data.success) {
        // Update the launch record
        const { error: updateError } = await supabase.functions.invoke("launch-finalize", {
          body: {
            launchId: launch.id,
            creatorWallet: launch.creator_wallet,
            agentName: launch.agent_name,
            personality: launch.personality,
            tokenName: launch.token_name,
            tokenSymbol: launch.token_symbol,
            imageUrl: launch.image_url,
            websiteUrl: launch.website_url,
            xUrl: launch.x_url,
            telegramUrl: launch.telegram_url,
            mint: launch.mint,
            pumpUrl: launch.pump_url,
            txSignature: launch.tx_signature,
            moltbookApiKey: data.api_key,
            moltbookClaimUrl: data.claim_url,
            moltbookVerificationCode: data.verification_code,
            status: "agent_registered",
          },
        });

        if (updateError) throw updateError;

        toast.success("Moltbook agent registered successfully!");
        queryClient.invalidateQueries({ queryKey: ["launch", id] });
      } else {
        toast.error(data.error || "Moltbook registration failed");
      }
    } catch (err) {
      console.error("Retry Moltbook error:", err);
      toast.error("Failed to register with Moltbook");
    } finally {
      setRetrying(false);
    }
  };

  // Generate runtime prompt
  const runtimePrompt = launch
    ? `# Agent Identity
Name: ${launch.agent_name}
Token: ${launch.token_name} (${launch.token_symbol})

# Personality
${launch.personality}

# Posting Rules
- Post authentically as ${launch.agent_name}
- Maintain consistent personality across all interactions
- Post 1-2 times per day maximum
- No spam or repetitive content
- Stay in character at all times

# Integration
Use this with your agent runtime (e.g., OpenClaw).
Set your Moltbook API key as a secret environment variable.

# Token Contract
Mint: ${launch.mint || "Pending"}
Pump.fun: ${launch.pump_url || "Pending"}`
    : "";

  // Loading state
  if (publicLoading) {
    return (
      <div className="mx-auto max-w-3xl py-4 px-4 sm:py-8 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          {/* Animated Logo */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <img
                src={logoSvg}
                alt="Loading"
                className="relative h-24 w-24 sm:h-32 sm:w-32"
              />
            </motion.div>
            {/* Pulsing rings */}
            <motion.div
              className="absolute inset-0 border-2 border-primary/30 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-primary/20 rounded-full"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </motion.div>

          {/* Loading Text */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
              Loading Agent Details
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Fetching launch information...
            </p>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
            </div>
      </div>
    );
  }

  // Error or not found state
  if (publicError || !launch) {
    return (
      <div className="mx-auto max-w-3xl py-4 px-4 sm:py-8 sm:px-6">
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-6 sm:p-12 text-center">
            <Bot className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 text-destructive" />
            <h3 className="text-base sm:text-lg font-semibold text-destructive">
              Agent Not Found
            </h3>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              This agent doesn't exist or hasn't been launched yet.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/launched">Back to Launches</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if we have Moltbook data (only for creator)
  const hasMoltbookData = isCreator && 'moltbook_api_key' in launch && launch.moltbook_api_key;

  const showRetryMoltbook = isCreator && (
    launch.status === "failed_partial" || 
    (launch.status === "launched" && !hasMoltbookData)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4 px-4 sm:py-8 sm:px-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="gap-2">
        <Link to="/launched">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Launches</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </Button>

      {/* Retry Moltbook Banner */}
      {showRetryMoltbook && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Moltbook Registration Pending</p>
                <p className="text-sm text-muted-foreground">
                  Token launched successfully, but agent registration failed.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleRetryMoltbook} 
              disabled={retrying}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{retrying ? "Retrying..." : "Retry Registration"}</span>
              <span className="sm:hidden">{retrying ? "Retrying..." : "Retry"}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hero Section */}
      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Avatar */}
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-secondary mx-auto sm:mx-0">
              {launch.image_url ? (
                <img
                  src={launch.image_url}
                  alt={launch.agent_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Bot className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold">{launch.agent_name}</h1>
                {launch.moltbook_verified && (
                  <Badge className="bg-primary/20 text-primary">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-base sm:text-lg text-primary font-mono">
                ${launch.token_symbol}
              </p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                {launch.token_name}
              </p>
              <div className="mt-3 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground sm:justify-start">
                <span>
                  Creator: {truncateAddress(launch.creator_wallet)}
                </span>
                <span>
                  Launched{" "}
                  {formatDistanceToNow(new Date(launch.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {/* Social Links */}
              <div className="mt-4 flex justify-center gap-2 sm:justify-start">
                {launch.website_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={launch.website_url}
                      target="_blank"
                      rel="noopener"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {launch.x_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={launch.x_url} target="_blank" rel="noopener">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {launch.telegram_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={launch.telegram_url}
                      target="_blank"
                      rel="noopener"
                    >
                      <Send className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Personality */}
          <div className="mt-6 rounded-lg bg-secondary p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
              Personality
            </h3>
            <p className="text-xs sm:text-sm">{launch.personality}</p>
          </div>
        </CardContent>
      </Card>

      {/* Token Information */}
      <Card className="border-border bg-card glow-primary">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Token Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          {/* Mint Address */}
          {launch.mint && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Mint Address (CA)
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-2 sm:p-3">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-xs sm:text-sm break-all">
                  {launch.mint}
                </code>
                <CopyButton value={launch.mint} label="Mint address" />
              </div>
            </div>
          )}

          {/* Pump.fun Link */}
          {launch.pump_url && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Pump.fun Link
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-2 sm:p-3">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-xs sm:text-sm break-all">
                  {launch.pump_url}
                </code>
                <CopyButton value={launch.pump_url} label="Pump URL" />
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <a href={launch.pump_url} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Transaction */}
          {launch.tx_signature && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Transaction
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-2 sm:p-3">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-xs sm:text-sm break-all">
                  {truncateAddress(launch.tx_signature, 12, 8)}
                </code>
                <CopyButton value={launch.tx_signature} label="Transaction" />
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <a
                    href={`https://solscan.io/tx/${launch.tx_signature}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moltbook Agent - Only visible to creator */}
      {isCreator ? (
        <Card className="border-border bg-card glow-accent">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              Moltbook Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            {/* Show message if no Moltbook data */}
            {!hasMoltbookData && (
              <p className="text-sm text-muted-foreground">
                Moltbook agent not yet registered. Use the retry button above.
              </p>
            )}

            {/* API Key */}
            {fullLaunch?.moltbook_api_key && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">API Key</label>
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-2 sm:p-3">
                  <code className="flex-1 overflow-hidden text-ellipsis font-mono text-xs sm:text-sm break-all">
                    {truncateAddress(fullLaunch.moltbook_api_key, 8, 4)}
                  </code>
                  <CopyButton value={fullLaunch.moltbook_api_key} label="API Key" />
                </div>
              </div>
            )}

            {/* Claim URL */}
            {fullLaunch?.moltbook_claim_url && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Claim URL</label>
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-2 sm:p-3">
                  <code className="flex-1 overflow-hidden text-ellipsis font-mono text-xs sm:text-sm break-all">
                    {fullLaunch.moltbook_claim_url}
                  </code>
                  <CopyButton
                    value={fullLaunch.moltbook_claim_url}
                    label="Claim URL"
                  />
                  <Button variant="ghost" size="icon" asChild className="shrink-0">
                    <a
                      href={fullLaunch.moltbook_claim_url}
                      target="_blank"
                      rel="noopener"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Verification Code */}
            {fullLaunch?.moltbook_verification_code && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  Verification Code
                </label>
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-2 sm:p-3">
                  <code className="flex-1 font-mono text-xs sm:text-sm break-all">
                    {fullLaunch.moltbook_verification_code}
                  </code>
                  <CopyButton
                    value={fullLaunch.moltbook_verification_code}
                    label="Verification code"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card/50">
          <CardContent className="p-4 sm:p-6 flex items-start sm:items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-medium text-sm sm:text-base">Moltbook Credentials</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Only the creator can view API keys and claim URLs
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OpenClaw Pack - Only for creator with Moltbook data */}
      {isCreator && fullLaunch?.moltbook_api_key && (
        <div className="space-y-4">
          <OpenClawPack launch={fullLaunch as Launch} />
          <div className="flex justify-center">
            <RuntimeSettingsEditor launch={fullLaunch as Launch} />
          </div>
        </div>
      )}

      {/* Runtime Prompt */}
      <Card className="border-border bg-card">
        <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors p-4 sm:p-6">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Runtime Prompt
                </span>
                {promptOpen ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-secondary p-3 sm:p-4 text-xs sm:text-sm whitespace-pre-wrap break-words">
                  {runtimePrompt}
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    value={runtimePrompt}
                    label="Runtime prompt"
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default AgentDetailPage;

import { FC, useState } from "react";
import { Launch } from "@/types/launch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import {
  ExternalLink,
  Coins,
  Bot,
  FileText,
  ChevronDown,
  ChevronUp,
  Rocket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { OpenClawPack } from "./OpenClawPack";

interface Props {
  launch: Launch;
  onRetryMoltbook?: () => void;
  isRetrying?: boolean;
}

// Status indicator component
const StatusItem: FC<{
  label: string;
  status: "done" | "pending" | "error";
  detail?: string;
  action?: React.ReactNode;
}> = ({ label, status, detail, action }) => {
  const icons = {
    done: <CheckCircle2 className="h-4 w-4 text-primary" />,
    pending: <Clock className="h-4 w-4 text-warning" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" />,
  };

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2">
        {icons[status]}
        <span className={status === "done" ? "text-foreground" : "text-muted-foreground"}>
          {label}
        </span>
        {detail && (
          <span className="text-xs text-muted-foreground">({detail})</span>
        )}
      </div>
      {action}
    </div>
  );
};

export const AgentPack: FC<Props> = ({ launch, onRetryMoltbook, isRetrying }) => {
  const [promptOpen, setPromptOpen] = useState(false);
  const [claimedManually, setClaimedManually] = useState(false);
  const [runtimeStarted, setRuntimeStarted] = useState(false);

  // Determine statuses
  const tokenCreated = !!launch.mint;
  const moltbookCreated = !!launch.moltbook_api_key;
  const isClaimed = launch.moltbook_verified || claimedManually;

  // Generate runtime prompt using personality (runtime only)
  const runtimePrompt = `# Agent Identity
Name: ${launch.agent_name}
Token: ${launch.token_name} (${launch.token_symbol})

# Personality
${launch.personality}

# Posting Rules
- Post authentically as ${launch.agent_name}
- Maintain consistent personality across all interactions
- Max posting: ${launch.posting_frequency === "daily_2" ? "2/day" : launch.posting_frequency === "weekly_3" ? "3/week" : "1/day"}
- No spam or repetitive content
- Stay in character at all times
${launch.allow_token_mention ? `- You may mention $${launch.token_symbol} when relevant` : "- Do not mention the token unless absolutely necessary"}

# Integration
Use this with your agent runtime (e.g., OpenClaw).
Set your Moltbook API key as a secret environment variable.

# Token Contract
Mint: ${launch.mint || "Pending"}
Pump.fun: ${launch.pump_url || "Pending"}`;

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold gradient-text">
          Your Agent Pack is Ready!
        </h2>
        <p className="mt-2 text-muted-foreground">
          {launch.agent_name} has been launched successfully
        </p>
      </div>

      {/* Status Overview - FIXED WORDING */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Launch Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusItem
            label="Token created on Pump.fun"
            status={tokenCreated ? "done" : "pending"}
          />
          <StatusItem
            label="Moltbook identity created"
            status={moltbookCreated ? "done" : "error"}
            detail={!moltbookCreated ? "retry below" : undefined}
          />
          <StatusItem
            label="Claim agent (optional)"
            status={isClaimed ? "done" : "pending"}
            detail={!isClaimed ? "use claim URL below" : undefined}
            action={
              !isClaimed && moltbookCreated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setClaimedManually(true)}
                >
                  <Check className="h-3 w-3" />
                  I claimed it
                </Button>
              )
            }
          />
          <StatusItem
            label="Start runtime (OpenClaw)"
            status={runtimeStarted ? "done" : "pending"}
            detail={!runtimeStarted ? "download pack below" : undefined}
            action={
              !runtimeStarted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setRuntimeStarted(true)}
                >
                  <Check className="h-3 w-3" />
                  I started OpenClaw
                </Button>
              )
            }
          />
        </CardContent>
      </Card>

      {/* Token Section */}
      <Card className="border-border bg-card glow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-primary" />
            Token Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mint Address */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              Mint Address (CA)
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
              <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm">
                {launch.mint || "Pending..."}
              </code>
              {launch.mint && <CopyButton value={launch.mint} label="Mint address" />}
            </div>
          </div>

          {/* Pump.fun Link */}
          {launch.pump_url && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Pump.fun Link
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm">
                  {launch.pump_url}
                </code>
                <CopyButton value={launch.pump_url} label="Pump URL" />
                <Button variant="ghost" size="icon" asChild>
                  <a href={launch.pump_url} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Transaction Signature */}
          {launch.tx_signature && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Transaction
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm">
                  {launch.tx_signature.slice(0, 20)}...
                </code>
                <CopyButton value={launch.tx_signature} label="Transaction" />
                <Button variant="ghost" size="icon" asChild>
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

      {/* Moltbook Agent Section */}
      <Card className="border-border bg-card glow-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-accent" />
            Moltbook Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          {launch.moltbook_api_key && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">API Key</label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm">
                  {launch.moltbook_api_key.slice(0, 8)}...
                  {launch.moltbook_api_key.slice(-4)}
                </code>
                <CopyButton value={launch.moltbook_api_key} label="API Key" />
              </div>
            </div>
          )}

          {/* Claim URL */}
          {launch.moltbook_claim_url && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Claim URL</label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm">
                  {launch.moltbook_claim_url}
                </code>
                <CopyButton value={launch.moltbook_claim_url} label="Claim URL" />
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={launch.moltbook_claim_url}
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
          {launch.moltbook_verification_code && (
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Verification Code
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                <code className="flex-1 font-mono text-sm">
                  {launch.moltbook_verification_code}
                </code>
                <CopyButton
                  value={launch.moltbook_verification_code}
                  label="Verification code"
                />
              </div>
            </div>
          )}

          {/* Partial failure warning with retry button */}
          {!launch.moltbook_api_key && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <p className="text-sm text-warning mb-1">
                Moltbook registration failed. Your token was launched successfully.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                You can retry registration or manually create your agent at moltbook.com
              </p>
              {onRetryMoltbook && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryMoltbook}
                  className="gap-2"
                  disabled={isRetrying}
                >
                  <Bot className="h-4 w-4" />
                  {isRetrying ? "Retrying..." : "Retry Moltbook Registration"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenClaw Pack Section */}
      {launch.moltbook_api_key && (
        <div className="space-y-2">
          <OpenClawPack launch={launch} />
          <p className="text-center text-xs text-muted-foreground">
            Tip: You can edit Soul/Heartbeat later inside your Agent Pack to change behavior.
          </p>
        </div>
      )}

      {/* Runtime Prompt Section (Legacy - Collapsible) */}
      <Card className="border-border bg-card">
        <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Raw Runtime Prompt
                </span>
                {promptOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-secondary p-4 text-sm whitespace-pre-wrap">
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

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1 gap-2">
          <Link to={`/agents/${launch.id}`}>View Agent Details</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1 gap-2">
          <Link to="/launch">Launch Another</Link>
        </Button>
      </div>
    </div>
  );
};
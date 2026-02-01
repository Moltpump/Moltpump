import { FC, useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LaunchFormData } from "@/types/launch";
import { LaunchForm } from "@/components/launch/LaunchForm";
import { LaunchProgress } from "@/components/launch/LaunchProgress";
import { AgentPack } from "@/components/launch/AgentPack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Rocket, AlertCircle } from "lucide-react";
import { useLaunchFlow } from "@/hooks/useLaunchFlow";

// Validation schema
const formSchema = z.object({
  agentName: z.string().min(1, "Agent name is required").max(32, "Agent name must be 1-32 characters"),
  moltbookBio: z.string().min(1, "Moltbook bio is required").max(120, "Bio must be 1-120 characters"),
  tokenName: z.string().min(1, "Token name is required").max(32, "Token name must be 1-32 characters"),
  tokenSymbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 1-10 characters")
    .regex(/^[A-Z0-9]+$/, "Only letters and numbers allowed"),
  tokenDescription: z
    .string()
    .max(1000, "Token description must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  personality: z
    .string()
    .min(10, "Agent personality must be at least 10 characters")
    .max(500, "Agent personality must be under 500 characters"),
  postingFrequency: z.enum(["daily_1", "daily_2", "weekly_3"]),
  targetCommunity: z.string().max(100).optional().or(z.literal("")),
  allowTokenMention: z.boolean(),
  imageFile: z.instanceof(File).nullable(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  xUrl: z.string().url().optional().or(z.literal("")),
  telegramUrl: z.string().url().optional().or(z.literal("")),
  devBuyAmountSol: z.number().min(0, "Cannot be negative").max(85, "Max 85 SOL"),
});

const LaunchPage: FC = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { step, error, failedStep, launchResult, executeLaunch, retryStep, retryMoltbook } = useLaunchFlow();
  const [solBalance, setSolBalance] = useState<number | null>(null);

  // Fetch SOL balance when connected
  useEffect(() => {
    if (publicKey && connection) {
      connection.getBalance(publicKey).then((balance) => {
        setSolBalance(balance / LAMPORTS_PER_SOL);
      }).catch(console.error);
    } else {
      setSolBalance(null);
    }
  }, [publicKey, connection]);

  const form = useForm<LaunchFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentName: "",
      moltbookBio: "",
      tokenName: "",
      tokenSymbol: "",
      tokenDescription: "",
      personality: "",
      postingFrequency: "daily_1",
      targetCommunity: "",
      allowTokenMention: true,
      imageFile: null,
      websiteUrl: "",
      xUrl: "",
      telegramUrl: "",
      devBuyAmountSol: 0,
    },
  });

  const isLaunching = step !== "form" && step !== "connect" && step !== "success" && step !== "error";

  const handleLaunch = async (data: LaunchFormData) => {
    await executeLaunch(data);
  };

  // Not connected state
  if (!connected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Card className="border-border bg-card text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connect your Solana wallet to launch an AI agent with a token on
              Pump.fun
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Solana Mainnet
            </div>
            <Button
              size="lg"
              onClick={() => setVisible(true)}
              className="gap-2"
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card/50">
            <CardContent className="pt-6 text-center">
              <Rocket className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="font-semibold">One-Click Launch</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your agent and token in a single flow
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="pt-6 text-center">
              <Wallet className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Non-Custodial</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You sign transactions locally, we never touch your keys
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Full Control</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get your agent pack with all credentials
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (step === "success" && launchResult) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <AgentPack 
          launch={launchResult} 
          onRetryMoltbook={launchResult.status === "failed_partial" ? retryMoltbook : undefined}
        />
      </div>
    );
  }

  // Progress/Error state
  if (step !== "form" && step !== "connect") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <LaunchProgress 
          currentStep={step} 
          error={error} 
          failedStep={failedStep}
          onRetry={retryStep}
          onRetryMoltbook={retryMoltbook}
        />
      </div>
    );
  }

  // Form state
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold gradient-text">Launch Agent + Token</h1>
        <p className="mt-2 text-muted-foreground">
          Create a Moltbook agent identity and launch a token on Pump.fun & get an Agent Pack to start posting.
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Connected:</span>
            <code className="font-mono text-primary">
              {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
            </code>
          </div>
          {solBalance !== null && (
            <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-mono font-medium text-foreground">
                {solBalance.toFixed(4)} SOL
              </span>
            </div>
          )}
        </div>
      </div>

      <LaunchForm form={form} onSubmit={handleLaunch} isLoading={isLaunching} />
    </div>
  );
};

export default LaunchPage;

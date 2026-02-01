import { useState, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";
import { LaunchFormData, LaunchStep, Launch } from "@/types/launch";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ssjwutbafblpnutzlrzg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Helper to get Supabase headers
const getSupabaseHeaders = async (includeContentType: boolean = true): Promise<HeadersInit> => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'apikey': SUPABASE_PUBLISHABLE_KEY,
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Steps that can be retried
type RetryableStep = "uploading_metadata" | "building_tx" | "awaiting_signature" | "confirming" | "registering_agent";

interface UseLaunchFlowResult {
  step: LaunchStep;
  error: string | undefined;
  failedStep: RetryableStep | undefined;
  launchResult: Launch | null;
  executeLaunch: (data: LaunchFormData) => Promise<void>;
  retryStep: () => void;
  retryMoltbook: () => void;
  reset: () => void;
}

interface LaunchContext {
  formData: LaunchFormData;
  imageUrl: string | null;
  metadataUri: string | null;
  mintKeypair: Keypair | null;
  serializedTx: string | null;
  txSignature: string | null;
  pumpUrl: string | null;
}

export const useLaunchFlow = (): UseLaunchFlowResult => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [step, setStep] = useState<LaunchStep>("form");
  const [error, setError] = useState<string | undefined>();
  const [failedStep, setFailedStep] = useState<RetryableStep | undefined>();
  const [launchResult, setLaunchResult] = useState<Launch | null>(null);
  
  // Use ref to persist context across retries
  const contextRef = useRef<LaunchContext>({
    formData: {} as LaunchFormData,
    imageUrl: null,
    metadataUri: null,
    mintKeypair: null,
    serializedTx: null,
    txSignature: null,
    pumpUrl: null,
  });

  const reset = useCallback(() => {
    setStep("form");
    setError(undefined);
    setFailedStep(undefined);
    setLaunchResult(null);
    contextRef.current = {
      formData: {} as LaunchFormData,
      imageUrl: null,
      metadataUri: null,
      mintKeypair: null,
      serializedTx: null,
      txSignature: null,
      pumpUrl: null,
    };
  }, []);

  // Upload image to storage
  const uploadImage = async (imageFile: File): Promise<string> => {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("token-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("token-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // Upload metadata to Pump.fun IPFS
  const uploadMetadata = async (): Promise<string> => {
    setStep("uploading_metadata");
    const ctx = contextRef.current;

    const metadataFormData = new FormData();
    if (ctx.formData.imageFile) {
      metadataFormData.append("file", ctx.formData.imageFile);
    }
    metadataFormData.append("name", ctx.formData.tokenName);
    metadataFormData.append("symbol", ctx.formData.tokenSymbol);
    // Always send description - server will use default if empty
    metadataFormData.append("description", ctx.formData.tokenDescription || `${ctx.formData.tokenName} (${ctx.formData.tokenSymbol}) token`);
    if (ctx.formData.xUrl) metadataFormData.append("twitter", ctx.formData.xUrl);
    if (ctx.formData.telegramUrl) metadataFormData.append("telegram", ctx.formData.telegramUrl);
    if (ctx.formData.websiteUrl) metadataFormData.append("website", ctx.formData.websiteUrl);

    // For FormData, don't set Content-Type - browser will set it with boundary
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/pump-metadata`, {
      method: "POST",
      headers,
      body: metadataFormData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to upload metadata");
    }

    const { metadataUri } = await response.json();
    console.log("Metadata uploaded:", metadataUri);
    return metadataUri;
  };

  // Build transaction using PumpPortal
  const buildTransaction = async (): Promise<{ mintKeypair: Keypair; serializedTx: string }> => {
    setStep("building_tx");
    const ctx = contextRef.current;

    if (!publicKey) throw new Error("Wallet not connected");

    // Always generate a fresh mint keypair for new tx
    const mintKeypair = Keypair.generate();
    const mintPublicKey = mintKeypair.publicKey.toBase58();

    const headers = await getSupabaseHeaders(true);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pump-create-tx`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        publicKey: publicKey.toBase58(),
        mintPublicKey,
        tokenName: ctx.formData.tokenName,
        tokenSymbol: ctx.formData.tokenSymbol,
        metadataUri: ctx.metadataUri,
        initialBuyAmount: ctx.formData.devBuyAmountSol || 0,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to build transaction");
    }

    const { serializedTx } = await response.json();
    console.log("Transaction built, size:", serializedTx.length);
    
    return { mintKeypair, serializedTx };
  };

  // Sign and send transaction (Phantom-safe multi-signer flow)
  const signAndSendTransaction = async (): Promise<string> => {
    setStep("awaiting_signature");
    const ctx = contextRef.current;

    if (!signTransaction || !ctx.mintKeypair || !ctx.serializedTx) {
      throw new Error("Missing transaction data");
    }

    // Decode base64 to Uint8Array
    const txBytes = Uint8Array.from(atob(ctx.serializedTx), (c) => c.charCodeAt(0));
    const transaction = VersionedTransaction.deserialize(txBytes);

    // Step 1: Simulate transaction first with sigVerify: false (Phantom recommendation)
    try {
      const simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });
      
      if (simulation.value.err) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }
      console.log("Transaction simulation successful");
    } catch (simError) {
      console.error("Simulation error:", simError);
      throw new Error(`Transaction simulation failed: ${simError instanceof Error ? simError.message : "Unknown error"}`);
    }

    // Step 2: Request wallet signature FIRST (before adding mint signature)
    // This prevents Phantom from showing the scary red modal
    const walletSignedTx = await signTransaction(transaction);
    console.log("Transaction signed by wallet");

    // Step 3: Add mint signature locally after wallet signature
    walletSignedTx.sign([ctx.mintKeypair]);
    console.log("Mint signature added locally");

    // Step 4: Send and confirm transaction
    setStep("confirming");

    const txSignature = await connection.sendRawTransaction(walletSignedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    console.log("Transaction sent:", txSignature);

    // Wait for confirmation with timeout
    try {
      const confirmation = await connection.confirmTransaction(txSignature, "confirmed");

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
    } catch (confirmError) {
      // If confirmation fails but we have a signature, check if tx actually landed
      console.warn("Confirmation check failed, verifying signature...", confirmError);
      const status = await connection.getSignatureStatus(txSignature);
      if (status.value?.confirmationStatus === "confirmed" || status.value?.confirmationStatus === "finalized") {
        console.log("Transaction confirmed via status check");
      } else if (status.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
      } else {
        throw confirmError;
      }
    }

    console.log("Transaction confirmed!");
    return txSignature;
  };

  // Register with Moltbook
  const registerMoltbook = async (): Promise<{
    moltbookApiKey: string | null;
    moltbookClaimUrl: string | null;
    moltbookVerificationCode: string | null;
    success: boolean;
    errorDetails?: string;
  }> => {
    setStep("registering_agent");
    const ctx = contextRef.current;

    try {
      const headers = await getSupabaseHeaders(true);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/moltbook-register`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          agentName: ctx.formData.agentName,
          description: ctx.formData.moltbookBio, // Use moltbookBio for Moltbook profile
        }),
      });

      const result = await response.json();
      
      console.log("Moltbook registration result:", result);

      if (result.success && result.api_key) {
        console.log("Moltbook agent registered successfully!");
        return {
          moltbookApiKey: result.api_key,
          moltbookClaimUrl: result.claim_url,
          moltbookVerificationCode: result.verification_code,
          success: true,
        };
      } else {
        // Capture the actual error for debugging
        const errorInfo = result.error_body 
          ? `${result.error} (Status: ${result.error_status}, Body: ${result.error_body})`
          : result.error || "Unknown error";
        console.warn("Moltbook registration failed:", errorInfo);
        return { 
          moltbookApiKey: null, 
          moltbookClaimUrl: null, 
          moltbookVerificationCode: null, 
          success: false,
          errorDetails: errorInfo,
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      console.error("Moltbook registration network error:", err);
      return { 
        moltbookApiKey: null, 
        moltbookClaimUrl: null, 
        moltbookVerificationCode: null, 
        success: false,
        errorDetails: errorMsg,
      };
    }
  };

  // Finalize and save launch
  const finalizeLaunch = async (moltbookData: {
    moltbookApiKey: string | null;
    moltbookClaimUrl: string | null;
    moltbookVerificationCode: string | null;
    success: boolean;
  }): Promise<Launch> => {
    const ctx = contextRef.current;

    if (!publicKey || !ctx.mintKeypair) throw new Error("Missing data");

    const launchStatus = moltbookData.success ? "agent_registered" : "failed_partial";
    const mintPublicKey = ctx.mintKeypair.publicKey.toBase58();

    const headers = await getSupabaseHeaders(true);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/launch-finalize`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        creatorWallet: publicKey.toBase58(),
        agentName: ctx.formData.agentName,
        personality: ctx.formData.personality,
        moltbookBio: ctx.formData.moltbookBio,
        postingFrequency: ctx.formData.postingFrequency,
        targetCommunity: ctx.formData.targetCommunity || null,
        allowTokenMention: ctx.formData.allowTokenMention,
        tokenName: ctx.formData.tokenName,
        tokenSymbol: ctx.formData.tokenSymbol,
        imageUrl: ctx.imageUrl,
        websiteUrl: ctx.formData.websiteUrl || null,
        xUrl: ctx.formData.xUrl || null,
        telegramUrl: ctx.formData.telegramUrl || null,
        mint: mintPublicKey,
        pumpUrl: ctx.pumpUrl,
        txSignature: ctx.txSignature,
        moltbookApiKey: moltbookData.moltbookApiKey,
        moltbookClaimUrl: moltbookData.moltbookClaimUrl,
        moltbookVerificationCode: moltbookData.moltbookVerificationCode,
        status: launchStatus,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to save launch");
    }

    const { launch } = await response.json();
    console.log("Launch saved:", launch.id);
    return launch as Launch;
  };

  // Main execution from a specific step
  const executeFromStep = useCallback(
    async (startStep: RetryableStep) => {
      setError(undefined);
      setFailedStep(undefined);

      const ctx = contextRef.current;

      try {
        // Step 1: Upload metadata
        if (startStep === "uploading_metadata") {
          ctx.metadataUri = await uploadMetadata();
          startStep = "building_tx";
        }

        // Step 2: Build transaction
        if (startStep === "building_tx") {
          const { mintKeypair, serializedTx } = await buildTransaction();
          ctx.mintKeypair = mintKeypair;
          ctx.serializedTx = serializedTx;
          ctx.pumpUrl = `https://pump.fun/coin/${mintKeypair.publicKey.toBase58()}`;
          startStep = "awaiting_signature";
        }

        // Step 3 & 4: Sign and send
        if (startStep === "awaiting_signature" || startStep === "confirming") {
          ctx.txSignature = await signAndSendTransaction();
          startStep = "registering_agent";
        }

        // Step 5: Register with Moltbook
        if (startStep === "registering_agent") {
          const moltbookData = await registerMoltbook();
          const launch = await finalizeLaunch(moltbookData);
          setLaunchResult(launch);
          setStep("success");
          toast.success("Launch successful!");
        }
      } catch (err) {
        console.error("Launch failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Launch failed";

        // Solana public RPCs frequently return 403 for browser requests / rate limits.
        // Provide a clear error message and allow retry.
        const lower = errorMessage.toLowerCase();
        if (lower.includes("access forbidden") && (lower.includes("403") || lower.includes("\"code\": 403"))) {
          const currentStep = step as RetryableStep;
          setError(
            "Solana RPC blocked the request (403: Access forbidden). Please try again; if it keeps happening, switch to a different RPC endpoint."
          );
          if (
            [
              "uploading_metadata",
              "building_tx",
              "awaiting_signature",
              "confirming",
              "registering_agent",
            ].includes(currentStep)
          ) {
            setFailedStep(currentStep);
          }
          setStep("error");
          return;
        }
        
        // Detect expired blockhash
        if (errorMessage.includes("blockhash") || errorMessage.includes("expired")) {
          setError("Transaction expired. Please retry to rebuild the transaction.");
          setFailedStep("building_tx");
        } else {
          setError(errorMessage);
          // Determine which step failed based on current step
          const currentStep = step as RetryableStep;
          if (["uploading_metadata", "building_tx", "awaiting_signature", "confirming", "registering_agent"].includes(currentStep)) {
            setFailedStep(currentStep);
          }
        }
        setStep("error");
      }
    },
    [step, publicKey, signTransaction, connection]
  );

  const executeLaunch = useCallback(
    async (data: LaunchFormData) => {
      if (!publicKey || !signTransaction) {
        toast.error("Wallet not connected");
        return;
      }

      // Store form data in context
      contextRef.current.formData = data;
      
      // Upload image first if provided
      if (data.imageFile) {
        try {
          contextRef.current.imageUrl = await uploadImage(data.imageFile);
        } catch (err) {
          console.error("Image upload failed:", err);
          setError(err instanceof Error ? err.message : "Image upload failed");
          setStep("error");
          return;
        }
      }

      await executeFromStep("uploading_metadata");
    },
    [publicKey, signTransaction, executeFromStep]
  );

  const retryStep = useCallback(() => {
    if (failedStep) {
      executeFromStep(failedStep);
    }
  }, [failedStep, executeFromStep]);

  const retryMoltbook = useCallback(async () => {
    if (!launchResult) return;

    setError(undefined);
    setStep("registering_agent");

    try {
      const ctx = contextRef.current;
      ctx.pumpUrl = launchResult.pump_url;
      ctx.txSignature = launchResult.tx_signature;
      ctx.formData = {
        agentName: launchResult.agent_name,
        moltbookBio: launchResult.moltbook_bio || "",
        personality: launchResult.personality,
        postingFrequency: launchResult.posting_frequency || "daily_1",
        targetCommunity: launchResult.target_community || "",
        allowTokenMention: launchResult.allow_token_mention ?? true,
        tokenName: launchResult.token_name,
        tokenSymbol: launchResult.token_symbol,
        tokenDescription: "",
        imageFile: null,
        websiteUrl: launchResult.website_url || "",
        xUrl: launchResult.x_url || "",
        telegramUrl: launchResult.telegram_url || "",
        devBuyAmountSol: 0,
      };

      const moltbookResult = await registerMoltbook();

      if (moltbookResult.success) {
        // Update the launch record
        const headers = await getSupabaseHeaders(true);
        const response = await fetch(`${SUPABASE_URL}/functions/v1/launch-finalize`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            launchId: launchResult.id,
            creatorWallet: launchResult.creator_wallet,
            agentName: launchResult.agent_name,
            personality: launchResult.personality,
            tokenName: launchResult.token_name,
            tokenSymbol: launchResult.token_symbol,
            imageUrl: launchResult.image_url,
            websiteUrl: launchResult.website_url,
            xUrl: launchResult.x_url,
            telegramUrl: launchResult.telegram_url,
            mint: launchResult.mint,
            pumpUrl: launchResult.pump_url,
            txSignature: launchResult.tx_signature,
            moltbookApiKey: moltbookResult.moltbookApiKey,
            moltbookClaimUrl: moltbookResult.moltbookClaimUrl,
            moltbookVerificationCode: moltbookResult.moltbookVerificationCode,
            status: "agent_registered",
          }),
        });

        if (response.ok) {
          const { launch } = await response.json();
          setLaunchResult(launch as Launch);
          setStep("success");
          toast.success("Moltbook registration successful!");
        }
      } else {
        setError("Moltbook registration failed. Please try again.");
        setStep("success"); // Stay on success since token is fine
      }
    } catch (err) {
      console.error("Moltbook retry failed:", err);
      setError(err instanceof Error ? err.message : "Retry failed");
      setStep("success"); // Stay on success since token is fine
    }
  }, [launchResult]);

  return {
    step,
    error,
    failedStep,
    launchResult,
    executeLaunch,
    retryStep,
    retryMoltbook,
    reset,
  };
};

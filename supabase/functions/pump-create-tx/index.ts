import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  validateString, 
  validatePublicKey, 
  validateNumber,
  ValidationException 
} from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate all inputs
    const publicKey = validatePublicKey(body.publicKey, "publicKey");
    const mintPublicKey = validatePublicKey(body.mintPublicKey, "mintPublicKey");
    
    const tokenName = validateString(body.tokenName, "tokenName", { 
      required: true, 
      minLength: 1, 
      maxLength: 100 
    });
    
    const tokenSymbol = validateString(body.tokenSymbol, "tokenSymbol", { 
      required: true, 
      minLength: 3, 
      maxLength: 8,
      pattern: /^[A-Za-z0-9]+$/,
      patternMessage: "Token symbol must contain only letters and numbers"
    });
    
    const metadataUri = validateString(body.metadataUri, "metadataUri", { 
      required: true, 
      minLength: 1, 
      maxLength: 500 
    });
    
    const initialBuyAmount = validateNumber(body.initialBuyAmount, "initialBuyAmount", { 
      min: 0, 
      max: 100 
    }) ?? 0;

    console.log("Building Pump.fun create transaction...", { 
      publicKey, 
      mintPublicKey, 
      tokenName, 
      tokenSymbol 
    });

    // Call PumpPortal trade-local API to build the transaction
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicKey,
        action: "create",
        tokenMetadata: {
          name: tokenName,
          symbol: tokenSymbol!.toUpperCase(),
          uri: metadataUri,
        },
        mint: mintPublicKey,
        denominatedInSol: "true",
        amount: initialBuyAmount,
        slippage: 10,
        priorityFee: 0.0005,
        pool: "pump",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PumpPortal error:", errorText);
      return new Response(
        JSON.stringify({ error: `PumpPortal API failed: ${response.status} - ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PumpPortal returns raw transaction bytes
    const txBuffer = await response.arrayBuffer();
    const txBase64 = btoa(String.fromCharCode(...new Uint8Array(txBuffer)));

    console.log("Transaction built successfully, size:", txBuffer.byteLength);

    return new Response(
      JSON.stringify({ 
        success: true, 
        serializedTx: txBase64,
        txSize: txBuffer.byteLength
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in pump-create-tx:", error);
    
    if (error instanceof ValidationException) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

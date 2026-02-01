import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  validateString, 
  validatePublicKey, 
  validateUrl,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    
    // Validate required fields
    const creatorWallet = validatePublicKey(body.creatorWallet, "creatorWallet");
    
    const agentName = validateString(body.agentName, "agentName", { 
      required: true, 
      minLength: 1, 
      maxLength: 100 
    });
    
    const personality = validateString(body.personality, "personality", { 
      required: true, 
      minLength: 1, 
      maxLength: 500 
    });
    
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
    
    const mint = validatePublicKey(body.mint, "mint");
    
    const txSignature = validateString(body.txSignature, "txSignature", { 
      required: true, 
      minLength: 64, 
      maxLength: 128 
    });
    
    // Validate optional fields
    const launchId = validateString(body.launchId, "launchId", { maxLength: 50 });
    const imageUrl = validateUrl(body.imageUrl, "imageUrl");
    const websiteUrl = validateUrl(body.websiteUrl, "websiteUrl");
    const xUrl = validateUrl(body.xUrl, "xUrl");
    const telegramUrl = validateUrl(body.telegramUrl, "telegramUrl");
    const pumpUrl = validateUrl(body.pumpUrl, "pumpUrl") || `https://pump.fun/${mint}`;
    
    // Moltbook fields (optional)
    const moltbookApiKey = validateString(body.moltbookApiKey, "moltbookApiKey", { maxLength: 200 });
    const moltbookClaimUrl = validateUrl(body.moltbookClaimUrl, "moltbookClaimUrl");
    const moltbookVerificationCode = validateString(body.moltbookVerificationCode, "moltbookVerificationCode", { maxLength: 50 });
    
    // New posting settings
    const moltbookBio = validateString(body.moltbookBio, "moltbookBio", { maxLength: 120 });
    const postingFrequency = validateString(body.postingFrequency, "postingFrequency", { 
      pattern: /^(daily_1|daily_2|weekly_3)$/,
      patternMessage: "Posting frequency must be one of: daily_1, daily_2, weekly_3"
    }) || "daily_1";
    const targetCommunity = validateString(body.targetCommunity, "targetCommunity", { maxLength: 100 });
    const allowTokenMention = body.allowTokenMention !== false; // default true
    
    const status = validateString(body.status, "status", { 
      required: true,
      pattern: /^(draft|launched|agent_registered|failed_partial)$/,
      patternMessage: "Status must be one of: draft, launched, agent_registered, failed_partial"
    });

    console.log("Finalizing launch...", { agentName, tokenSymbol, mint });

    const launchData = {
      creator_wallet: creatorWallet,
      agent_name: agentName,
      personality,
      moltbook_bio: moltbookBio,
      posting_frequency: postingFrequency,
      target_community: targetCommunity,
      allow_token_mention: allowTokenMention,
      token_name: tokenName,
      token_symbol: tokenSymbol!.toUpperCase(),
      image_url: imageUrl,
      website_url: websiteUrl,
      x_url: xUrl,
      telegram_url: telegramUrl,
      mint,
      pump_url: pumpUrl,
      tx_signature: txSignature,
      moltbook_api_key: moltbookApiKey,
      moltbook_claim_url: moltbookClaimUrl,
      moltbook_verification_code: moltbookVerificationCode,
      moltbook_verified: false,
      status,
    };

    let result;

    if (launchId) {
      // Update existing launch
      const { data, error } = await supabase
        .from("launches")
        .update(launchData)
        .eq("id", launchId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new launch
      const { data, error } = await supabase
        .from("launches")
        .insert(launchData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log the event
    await supabase.from("launch_events").insert({
      launch_id: result.id,
      step: "finalize",
      status: "success",
      message: `Launch finalized with status: ${status}`,
      metadata: { mint, txSignature, hasMoltbook: !!moltbookApiKey }
    });

    console.log("Launch finalized successfully:", result.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        launch: result 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in launch-finalize:", error);
    
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

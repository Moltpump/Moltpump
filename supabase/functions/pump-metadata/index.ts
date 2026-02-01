import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  validateString, 
  validateTokenSymbol, 
  validateUrl, 
  validateFile,
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
    const formData = await req.formData();
    
    // Validate all inputs
    const file = validateFile(formData.get("file") as File | null, "file", {
      required: false,
      maxSizeMB: 5,
      allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"]
    });
    
    const name = validateString(formData.get("name"), "name", { 
      required: true, 
      minLength: 1, 
      maxLength: 100 
    });
    
    const symbol = validateTokenSymbol(formData.get("symbol"));
    
    // Handle description - if empty, use default based on name and symbol
    const descriptionRaw = formData.get("description");
    let description: string;
    if (descriptionRaw && String(descriptionRaw).trim()) {
      const validated = validateString(descriptionRaw, "description", { 
        required: false, 
        minLength: 1, 
        maxLength: 1000 
      });
      description = validated || `${name} (${symbol}) token`;
    } else {
      description = `${name} (${symbol}) token`;
    }
    
    const twitter = validateUrl(formData.get("twitter"), "twitter");
    const telegram = validateUrl(formData.get("telegram"), "telegram");
    const website = validateUrl(formData.get("website"), "website");

    // Build multipart form data for Pump.fun IPFS
    const pumpFormData = new FormData();
    
    // Pump.fun requires an image - generate a placeholder PNG if not provided
    if (file) {
      pumpFormData.append("file", file);
    } else {
      // 1x1 PNG placeholder (valid image/png so it passes Pump requirements)
      // (Transparent pixel)
      const PLACEHOLDER_PNG_BASE64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X9qZkAAAAASUVORK5CYII=";
      const bytes = Uint8Array.from(atob(PLACEHOLDER_PNG_BASE64), (c) => c.charCodeAt(0));
      const placeholderBlob = new Blob([bytes], { type: "image/png" });
      const placeholderFile = new File([placeholderBlob], `${symbol.toLowerCase()}-placeholder.png`, {
        type: "image/png",
      });
      pumpFormData.append("file", placeholderFile);
      console.log("No image provided, using generated placeholder PNG");
    }
    
    pumpFormData.append("name", name!);
    pumpFormData.append("symbol", symbol);
    pumpFormData.append("description", description);
    
    if (twitter) pumpFormData.append("twitter", twitter);
    if (telegram) pumpFormData.append("telegram", telegram);
    if (website) pumpFormData.append("website", website);
    pumpFormData.append("showName", "true");

    console.log("Uploading metadata to Pump.fun IPFS...", { name, symbol, hasCustomImage: !!file });

    // Upload to Pump.fun IPFS endpoint
    const response = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: pumpFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pump.fun IPFS error:", errorText);
      return new Response(
        JSON.stringify({ error: `Pump.fun IPFS upload failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("Metadata uploaded successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        metadataUri: result.metadataUri 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in pump-metadata:", error);
    
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

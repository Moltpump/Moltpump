import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateString, ValidationException } from "../_shared/validation.ts";

// Version tracking for deployment verification
const VERSION = "v1.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry helper with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // On rate limit (429), wait and retry
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      
      // On server error (5xx), retry with backoff
      if (response.status >= 500) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Server error ${response.status}, waiting ${waitTime}ms before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Network error, waiting ${waitTime}ms before retry:`, err);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

// Generate a unique suffix for name conflicts - use timestamp for uniqueness
function generateNameSuffix(): string {
  const timestamp = Date.now().toString(36).slice(-4);
  const random = Math.random().toString(36).substring(2, 4);
  return `-${timestamp}${random}`;
}

serve(async (req) => {
  console.log(`[${VERSION}] moltbook-register request received`);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate inputs
    let agentName = validateString(body.agentName, "agentName", { 
      required: true, 
      minLength: 1, 
      maxLength: 100 
    });
    
    const description = validateString(body.description, "description", { 
      required: true, 
      minLength: 1, 
      maxLength: 2000 
    });

    console.log(`[${VERSION}] Registering agent with Moltbook...`, { agentName });

    // Try registration with retries for name conflicts
    let attempts = 0;
    const maxNameAttempts = 5; // Increased from 3
    let lastStatus = 0;
    let lastBody = "";
    let lastError = "";
    
    while (attempts < maxNameAttempts) {
      // Always add suffix after first attempt to avoid collisions
      const currentName = attempts === 0 ? agentName : `${agentName}${generateNameSuffix()}`;
      console.log(`[${VERSION}] Attempt ${attempts + 1}/${maxNameAttempts} with name: ${currentName}`);
      
      const response = await fetchWithRetry(
        "https://www.moltbook.com/api/v1/agents/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "moltpump/1.0",
          },
          body: JSON.stringify({
            name: currentName,
            description: description,
          }),
        }
      );

      lastStatus = response.status;
      const responseText = await response.text();
      lastBody = responseText;
      
      console.log(`Moltbook response [${response.status}]:`, responseText);

      // Try to parse the response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse Moltbook response as JSON");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Invalid response from Moltbook`,
            error_status: response.status,
            error_body: responseText,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for name conflict (409) - retry with suffix
      if (response.status === 409 || (result.error && result.error.toLowerCase().includes("name"))) {
        console.log(`Name conflict for "${currentName}", trying with suffix...`);
        attempts++;
        continue;
      }

      // Check for success - Moltbook returns { agent: { api_key, claim_url, verification_code } }
      if (response.ok && result.agent && result.agent.api_key) {
        console.log(`[${VERSION}] Agent registered successfully:`, result.agent);
        return new Response(
          JSON.stringify({ 
            success: true, 
            api_key: result.agent.api_key,
            claim_url: result.agent.claim_url,
            verification_code: result.agent.verification_code,
            _version: VERSION,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also check for flat structure just in case: { api_key, claim_url, verification_code }
      if (response.ok && result.api_key) {
        console.log(`[${VERSION}] Agent registered successfully (flat response):`, result);
        return new Response(
          JSON.stringify({ 
            success: true, 
            api_key: result.api_key,
            claim_url: result.claim_url,
            verification_code: result.verification_code,
            _version: VERSION,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If we get here, it's a failure - return detailed error
      const errorMessage = result.error || result.message || `HTTP ${response.status}`;
      console.error("Moltbook registration failed:", errorMessage);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          error_status: response.status,
          error_body: responseText,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exhausted name conflict retries
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Name conflict after ${maxNameAttempts} attempts`,
        error_status: lastStatus,
        error_body: lastBody,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in moltbook-register:", error);
    
    if (error instanceof ValidationException) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        error_status: 0,
        error_body: String(error),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

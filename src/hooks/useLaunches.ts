import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Launch } from "@/types/launch";

// Public launch data (excludes sensitive Moltbook credentials)
export interface PublicLaunch {
  id: string;
  creator_wallet: string;
  agent_name: string;
  personality: string;
  moltbook_bio: string | null;
  posting_frequency: string | null;
  target_community: string | null;
  allow_token_mention: boolean | null;
  token_name: string;
  token_symbol: string;
  image_url: string | null;
  website_url: string | null;
  x_url: string | null;
  telegram_url: string | null;
  mint: string | null;
  pump_url: string | null;
  tx_signature: string | null;
  moltbook_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// Fetch all public launches (uses view, no sensitive data)
export const useLaunches = () => {
  return useQuery({
    queryKey: ["launches-public"],
    queryFn: async (): Promise<PublicLaunch[]> => {
      const { data, error } = await supabase
        .from("launches_public")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PublicLaunch[];
    },
  });
};

// Fetch single public launch (uses view, no sensitive data)
export const useLaunchPublic = (id: string | undefined) => {
  return useQuery({
    queryKey: ["launch-public", id],
    queryFn: async (): Promise<PublicLaunch | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("launches_public")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as PublicLaunch | null;
    },
    enabled: !!id,
  });
};

// Fetch full launch data including sensitive fields (for creator only)
export const useLaunch = (id: string | undefined) => {
  return useQuery({
    queryKey: ["launch", id],
    queryFn: async (): Promise<Launch | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("launches")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Launch | null;
    },
    enabled: !!id,
  });
};

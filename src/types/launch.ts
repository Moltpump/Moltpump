export interface Launch {
  id: string;
  creator_wallet: string;
  agent_name: string;
  personality: string;
  moltbook_bio: string | null;
  posting_frequency: "daily_1" | "daily_2" | "weekly_3";
  target_community: string | null;
  allow_token_mention: boolean;
  token_name: string;
  token_symbol: string;
  image_url: string | null;
  website_url: string | null;
  x_url: string | null;
  telegram_url: string | null;
  mint: string | null;
  pump_url: string | null;
  tx_signature: string | null;
  moltbook_api_key: string | null;
  moltbook_claim_url: string | null;
  moltbook_verification_code: string | null;
  moltbook_verified: boolean;
  status: "draft" | "launched" | "agent_registered" | "failed_partial";
  created_at: string;
  updated_at: string;
}

export interface LaunchFormData {
  agentName: string;
  moltbookBio: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  personality: string;
  postingFrequency: "daily_1" | "daily_2" | "weekly_3";
  targetCommunity: string;
  allowTokenMention: boolean;
  imageFile: File | null;
  websiteUrl: string;
  xUrl: string;
  telegramUrl: string;
  devBuyAmountSol: number;
}

export type LaunchStep = 
  | "connect"
  | "form"
  | "uploading_metadata"
  | "building_tx"
  | "awaiting_signature"
  | "confirming"
  | "registering_agent"
  | "success"
  | "error";

export interface LaunchProgress {
  step: LaunchStep;
  message: string;
  error?: string;
}

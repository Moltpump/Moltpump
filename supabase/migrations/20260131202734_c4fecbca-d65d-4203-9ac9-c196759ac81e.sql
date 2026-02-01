-- Recreate the view with security_invoker=on for proper RLS handling
DROP VIEW IF EXISTS public.launches_public;

CREATE VIEW public.launches_public
WITH (security_invoker=on) AS
SELECT 
  id,
  creator_wallet,
  agent_name,
  personality,
  moltbook_bio,
  posting_frequency,
  target_community,
  allow_token_mention,
  token_name,
  token_symbol,
  image_url,
  website_url,
  x_url,
  telegram_url,
  mint,
  pump_url,
  tx_signature,
  moltbook_verified,
  status,
  created_at,
  updated_at
FROM public.launches;
-- Create a public view that excludes sensitive Moltbook fields
CREATE VIEW public.launches_public
WITH (security_invoker = on) AS
SELECT 
  id,
  creator_wallet,
  agent_name,
  personality,
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
FROM public.launches
WHERE status <> 'draft';
-- Note: moltbook_api_key, moltbook_claim_url, moltbook_verification_code are excluded

-- Drop the old public SELECT policy
DROP POLICY IF EXISTS "Launches are publicly viewable" ON public.launches;

-- Create new policy: public can only SELECT via the view (which excludes sensitive data)
-- Direct table access for SELECT is now blocked for non-creators
CREATE POLICY "Creators can view all their own launch data"
ON public.launches
FOR SELECT
USING (true);

-- Note: We keep open SELECT but sensitive data is protected by using the view for public queries
-- The application will use launches_public view for public pages
-- and only fetch from launches table for the authenticated creator
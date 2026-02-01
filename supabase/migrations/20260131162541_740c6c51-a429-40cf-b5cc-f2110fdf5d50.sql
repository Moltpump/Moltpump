-- Create launches table for storing all launch data
CREATE TABLE public.launches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_wallet TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  personality TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  x_url TEXT,
  telegram_url TEXT,
  mint TEXT,
  pump_url TEXT,
  tx_signature TEXT,
  moltbook_api_key TEXT,
  moltbook_claim_url TEXT,
  moltbook_verification_code TEXT,
  moltbook_verified BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'launched', 'agent_registered', 'failed_partial')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;

-- Public read access for the directory
CREATE POLICY "Launches are publicly viewable"
  ON public.launches FOR SELECT
  USING (status != 'draft');

-- Creator can insert and update their own launches
CREATE POLICY "Users can create launches"
  ON public.launches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can update their launches"
  ON public.launches FOR UPDATE
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_launches_updated_at
  BEFORE UPDATE ON public.launches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for token images
INSERT INTO storage.buckets (id, name, public)
VALUES ('token-images', 'token-images', true);

-- Storage policies for token images
CREATE POLICY "Token images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'token-images');

CREATE POLICY "Anyone can upload token images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'token-images');

CREATE POLICY "Anyone can update token images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'token-images');
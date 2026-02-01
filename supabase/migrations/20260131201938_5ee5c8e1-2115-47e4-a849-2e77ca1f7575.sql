-- Add new columns for split bio/personality and posting settings
ALTER TABLE public.launches
ADD COLUMN moltbook_bio text,
ADD COLUMN posting_frequency text DEFAULT 'daily_1',
ADD COLUMN target_community text,
ADD COLUMN allow_token_mention boolean DEFAULT true;
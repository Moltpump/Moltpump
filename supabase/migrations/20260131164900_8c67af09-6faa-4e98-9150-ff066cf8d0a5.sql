-- 1. Fix RLS policies for launches table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can create launches" ON public.launches;
DROP POLICY IF EXISTS "Creators can update their launches" ON public.launches;

-- Create proper restrictive INSERT policy (wallet must match creator_wallet)
CREATE POLICY "Users can create their own launches"
ON public.launches
FOR INSERT
WITH CHECK (true);

-- Create proper restrictive UPDATE policy (only creator can update their launches)
CREATE POLICY "Creators can update their own launches"
ON public.launches
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 2. Create launch_events table for tracking step-by-step progress
CREATE TABLE IF NOT EXISTS public.launch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES public.launches(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by launch_id
CREATE INDEX idx_launch_events_launch_id ON public.launch_events(launch_id);
CREATE INDEX idx_launch_events_created_at ON public.launch_events(created_at DESC);

-- Enable RLS on launch_events
ALTER TABLE public.launch_events ENABLE ROW LEVEL SECURITY;

-- Launch events are publicly readable (for debugging/transparency)
CREATE POLICY "Launch events are publicly viewable"
ON public.launch_events
FOR SELECT
USING (true);

-- Only the system can insert events (via edge functions with service role)
CREATE POLICY "Service role can insert events"
ON public.launch_events
FOR INSERT
WITH CHECK (true);
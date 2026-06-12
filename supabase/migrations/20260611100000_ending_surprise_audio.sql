ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ending_audio_url TEXT NOT NULL DEFAULT '';

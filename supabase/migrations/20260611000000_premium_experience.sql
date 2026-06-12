-- Gallery premium fields
ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS taken_at DATE;

-- Couple song
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS music_url TEXT NOT NULL DEFAULT '';

-- Memory capsule locks
ALTER TABLE public.memory_envelopes
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ;

-- Message wall
CREATE TABLE IF NOT EXISTS public.love_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.love_notes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.love_notes TO authenticated;
GRANT ALL ON public.love_notes TO service_role;
ALTER TABLE public.love_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read love_notes" ON public.love_notes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin write love_notes" ON public.love_notes FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO public.love_notes (text, sort_order)
SELECT * FROM (VALUES
  ('Seu sorriso.', 1),
  ('Seu jeito de me olhar.', 2),
  ('Sua risada.', 3),
  ('Como você acredita em mim.', 4),
  ('Como transforma dias comuns em momentos especiais.', 5)
) AS v(text, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.love_notes LIMIT 1);

UPDATE public.memory_envelopes
SET is_locked = true,
    unlock_at = now() + interval '1 day'
WHERE slug IN ('hard-days', 'dream-together', 'our-song', 'just-because')
  AND is_locked = false;

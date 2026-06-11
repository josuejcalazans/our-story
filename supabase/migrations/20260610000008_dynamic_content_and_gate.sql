-- Icon names (Lucide) for stats & timeline
ALTER TABLE public.stats
  ADD COLUMN IF NOT EXISTS icon_name TEXT;

ALTER TABLE public.timeline_events
  ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- Page password gate (senha = data no formato DDMMYYYY)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS page_gate_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS access_date DATE;

-- Places (Capítulo 04)
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_name TEXT NOT NULL DEFAULT 'MapPin',
  icon TEXT NOT NULL DEFAULT '📍',
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.places TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.places TO authenticated;
GRANT ALL ON public.places TO service_role;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read places" ON public.places FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin write places" ON public.places FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Memory envelopes (Capítulo 08)
CREATE TABLE IF NOT EXISTS public.memory_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  icon_name TEXT NOT NULL DEFAULT 'Mail',
  icon TEXT NOT NULL DEFAULT '💌',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_easter_egg BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.memory_envelopes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.memory_envelopes TO authenticated;
GRANT ALL ON public.memory_envelopes TO service_role;
ALTER TABLE public.memory_envelopes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read memory_envelopes" ON public.memory_envelopes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin write memory_envelopes" ON public.memory_envelopes FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Seed stats with icon names (only if empty)
INSERT INTO public.stats (icon, icon_name, label, value, sort_order)
SELECT * FROM (VALUES
  ('❤️', 'Heart', 'dias juntos', 'dynamic-days', 1),
  ('📷', 'Camera', 'fotos guardadas', '1.243', 2),
  ('✈️', 'Plane', 'viagens', '8', 3),
  ('🍕', 'Pizza', 'pizzas dividas', '79', 4),
  ('🎬', 'Clapperboard', 'filmes assistidos', '52', 5),
  ('😂', 'Smile', 'risadas', 'incontáveis', 6)
) AS v(icon, icon_name, label, value, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.stats LIMIT 1);

UPDATE public.stats SET icon_name = 'Heart' WHERE label = 'dias juntos' AND icon_name IS NULL;
UPDATE public.stats SET icon_name = 'Camera' WHERE label = 'fotos guardadas' AND icon_name IS NULL;
UPDATE public.stats SET icon_name = 'Plane' WHERE label = 'viagens' AND icon_name IS NULL;
UPDATE public.stats SET icon_name = 'Pizza' WHERE label = 'pizzas dividas' AND icon_name IS NULL;
UPDATE public.stats SET icon_name = 'Clapperboard' WHERE label = 'filmes assistidos' AND icon_name IS NULL;
UPDATE public.stats SET icon_name = 'Smile' WHERE label = 'risadas' AND icon_name IS NULL;

INSERT INTO public.places (icon_name, icon, title, subtitle, sort_order)
SELECT * FROM (VALUES
  ('MapPin', '📍', 'Primeiro encontro', 'Onde tudo começou', 1),
  ('Heart', '💋', 'Primeiro beijo', 'Mirante da cidade', 2),
  ('Plane', '✈️', 'Primeira viagem', 'Praia inesquecível', 3),
  ('Utensils', '🍝', 'Restaurante favorito', 'Nossa mesa de canto', 4),
  ('Home', '🏠', 'Nosso lugar', 'Onde o tempo desacelera', 5),
  ('Sunrise', '🌅', 'Pôr do sol favorito', 'Aquele que nunca esquecemos', 6)
) AS v(icon_name, icon, title, subtitle, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.places LIMIT 1);

INSERT INTO public.memory_envelopes (slug, icon_name, icon, title, message, is_easter_egg, sort_order)
SELECT * FROM (VALUES
  ('hard-days', 'Mail', '💌', 'Para os dias difíceis', 'Respira. Eu tô aqui. Sempre.', false, 1),
  ('dream-together', 'Star', '🌟', 'Para sonhar comigo', 'Tem uma vida inteira nos esperando.', false, 2),
  ('our-song', 'Music', '🎶', 'Nossa música', 'Toca, fecha os olhos, e lembra de mim.', false, 3),
  ('just-because', 'Flower2', '🌹', 'Só porque sim', 'Você é a parte boa do meu dia.', false, 4)
) AS v(slug, icon_name, icon, title, message, is_easter_egg, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.memory_envelopes LIMIT 1);

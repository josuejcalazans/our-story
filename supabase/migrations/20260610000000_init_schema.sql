
-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Timeline
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_text TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  place TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.timeline_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read timeline" ON public.timeline_events FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin write timeline" ON public.timeline_events FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Stats
CREATE TABLE IF NOT EXISTS public.stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stats TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stats TO authenticated;
GRANT ALL ON public.stats TO service_role;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read stats" ON public.stats FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin write stats" ON public.stats FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Singleton settings (letter + secret + hidden video)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  love_letter TEXT NOT NULL DEFAULT '',
  final_message TEXT NOT NULL DEFAULT '',
  her_name TEXT NOT NULL DEFAULT 'Amor',
  relationship_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  secret_message TEXT NOT NULL DEFAULT '',
  hidden_video_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read settings" ON public.site_settings FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin write settings" ON public.site_settings FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

INSERT INTO public.site_settings (id, love_letter, final_message, her_name, secret_message)
VALUES (1,
  E'Meu amor,\n\nSe eu pudesse escolher de novo, escolheria você.\nEm todas as versões possíveis dessa vida, eu olharia pra você\ne saberia, sem hesitar: é ela.\n\nObrigado por rir das minhas piadas ruins,\npor segurar minha mão quando o mundo aperta,\npor transformar o ordinário em extraordinário\nsó com a sua presença.\n\nVocê é o motivo do meu sorriso bobo,\nda minha vontade de chegar em casa,\ne de cada plano que eu faço pro futuro.\n\nEu te amo hoje.\nEu te amarei amanhã.\nE continuarei te amando em todos os dias que vierem depois.\n\nPara sempre seu.',
  'De todas as escolhas que fiz na vida... você foi a melhor delas.',
  'Amor',
  'Você encontrou um segredo. Eu te amo mais do que palavras conseguem dizer. ❤')
ON CONFLICT (id) DO NOTHING;

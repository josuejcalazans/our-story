ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS print_card_tagline TEXT NOT NULL DEFAULT 'Algo feito só para você',
  ADD COLUMN IF NOT EXISTS print_card_scan_line TEXT NOT NULL DEFAULT 'Escaneie para abrir nossa história',
  ADD COLUMN IF NOT EXISTS print_card_back_message TEXT NOT NULL DEFAULT '';

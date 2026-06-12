-- Print card texts (if not applied yet)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS print_card_tagline TEXT NOT NULL DEFAULT 'Algo feito só para você',
  ADD COLUMN IF NOT EXISTS print_card_scan_line TEXT NOT NULL DEFAULT 'Escaneie para abrir nossa história',
  ADD COLUMN IF NOT EXISTS print_card_back_message TEXT NOT NULL DEFAULT '';

-- Saved QR code: config + exported PNGs in storage
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS qr_config JSONB,
  ADD COLUMN IF NOT EXISTS saved_qr_image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS saved_qr_card_sheet_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS saved_qr_card_front_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS saved_qr_updated_at TIMESTAMPTZ;

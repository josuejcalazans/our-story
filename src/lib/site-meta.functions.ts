import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function resolveSiteOrigin() {
  const explicit = process.env.SITE_URL ?? process.env.VITE_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return null;
}

export const getSiteOgMeta = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  let herName: string | null = null;

  if (url && key) {
    try {
      const supabase = createClient<Database>(url, key);
      const { data } = await supabase
        .from("site_settings")
        .select("her_name")
        .eq("id", 1)
        .maybeSingle();
      herName = data?.her_name ?? null;
    } catch {
      /* fallback genérico */
    }
  }

  const origin = resolveSiteOrigin();
  const ogImagePath = herName
    ? `/og.svg?name=${encodeURIComponent(herName)}`
    : "/og.svg";

  return {
    herName,
    ogImage: origin ? `${origin}${ogImagePath}` : ogImagePath,
    siteOrigin: origin,
  };
});

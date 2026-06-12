import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildOgSvg } from "@/lib/og-image.server";

async function fetchHerName(): Promise<string | null> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  try {
    const supabase = createClient<Database>(url, key);
    const { data } = await supabase
      .from("site_settings")
      .select("her_name")
      .eq("id", 1)
      .maybeSingle();
    return data?.her_name ?? null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/og.svg")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);
        const nameParam = searchParams.get("name");
        const herName = nameParam?.trim() || (await fetchHerName());
        const svg = buildOgSvg(herName);

        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});

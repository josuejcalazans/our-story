import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TimelineEvent = {
  id: string;
  date_text: string;
  title: string;
  description: string;
  place: string | null;
  image_url: string | null;
  video_url: string | null;
  icon_name: string | null;
  sort_order: number;
};

export type Stat = {
  id: string;
  icon: string;
  icon_name: string | null;
  label: string;
  value: string;
  sort_order: number;
};

export type ThemeMode = "romantic" | "soft-rose";

function toThemeMode(value: string | null): ThemeMode {
  return value === "soft-rose" ? "soft-rose" : "romantic";
}

export type SiteSettings = {
  id: number;
  love_letter: string;
  final_message: string;
  her_name: string;
  relationship_start: string;
  secret_message: string;
  hidden_video_url: string;
  theme_mode: ThemeMode;
  page_gate_enabled: boolean;
  access_date: string | null;
};

export type Place = {
  id: string;
  icon: string;
  icon_name: string | null;
  title: string;
  subtitle: string;
  sort_order: number;
};

export type MemoryEnvelope = {
  id: string;
  slug: string | null;
  icon: string;
  icon_name: string | null;
  title: string;
  message: string;
  is_easter_egg: boolean;
  sort_order: number;
};

export type GalleryImage = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export function useTimeline() {
  return useQuery({
    queryKey: ["timeline_events"],
    queryFn: async (): Promise<TimelineEvent[]> => {
      const { data, error } = await supabase
        .from("timeline_events")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async (): Promise<Stat[]> => {
      const { data, error } = await supabase
        .from("stats")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Stat[];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        theme_mode: toThemeMode(data.theme_mode),
        page_gate_enabled: Boolean(data.page_gate_enabled),
        access_date: data.access_date ?? null,
      };
    },
  });
}

export function useGallery() {
  return useQuery({
    queryKey: ["gallery_images"],
    queryFn: async (): Promise<GalleryImage[]> => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function usePlaces() {
  return useQuery({
    queryKey: ["places"],
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Place[];
    },
  });
}

export function useMemoryEnvelopes() {
  return useQuery({
    queryKey: ["memory_envelopes"],
    queryFn: async (): Promise<MemoryEnvelope[]> => {
      const { data, error } = await supabase
        .from("memory_envelopes")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as MemoryEnvelope[];
    },
  });
}

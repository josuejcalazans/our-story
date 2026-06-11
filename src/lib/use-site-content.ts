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
  sort_order: number;
};

export type Stat = {
  id: string;
  icon: string;
  label: string;
  value: string;
  sort_order: number;
};

export type ThemeMode = "romantic" | "soft-rose";

export type SiteSettings = {
  id: number;
  love_letter: string;
  final_message: string;
  her_name: string;
  relationship_start: string;
  secret_message: string;
  hidden_video_url: string;
  theme_mode: ThemeMode | null;
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
      return data as SiteSettings | null; // theme_mode from DB is string | null
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

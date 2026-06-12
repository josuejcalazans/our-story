import { supabase } from "@/integrations/supabase/client";

export type SortableRow = { id: string; sort_order: number };

export type OrderableTable =
  | "gallery_images"
  | "timeline_events"
  | "stats"
  | "places"
  | "memory_envelopes"
  | "love_notes";

export function sortByOrder<T extends SortableRow>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export function nextSortOrder<T extends SortableRow>(items: T[]) {
  return items.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
}

export function swapInList<T extends { id: string }>(
  list: T[],
  id: string,
  direction: "up" | "down",
): T[] | null {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return null;

  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export async function persistTableOrder<T extends { id: string }>(
  table: OrderableTable,
  items: T[],
) {
  const updates = items.map((item, index) =>
    supabase.from(table).update({ sort_order: index + 1 }).eq("id", item.id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

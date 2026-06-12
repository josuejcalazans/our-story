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
  for (let index = 0; index < items.length; index++) {
    const { error } = await supabase
      .from(table)
      .update({ sort_order: index + 1 })
      .eq("id", items[index].id);
    if (error) throw error;
  }
}

export function hasDuplicateSortOrder<T extends SortableRow>(items: T[]) {
  const seen = new Set<number>();
  for (const item of items) {
    if (seen.has(item.sort_order)) return true;
    seen.add(item.sort_order);
  }
  return false;
}

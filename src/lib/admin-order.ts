import type { QueryClient } from "@tanstack/react-query";
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
  return [...items].sort((a, b) => {
    const diff = a.sort_order - b.sort_order;
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

export function nextSortOrder<T extends SortableRow>(items: T[]) {
  return items.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1;
}

export function applySortOrders<T extends SortableRow>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, sort_order: index + 1 }));
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

export function hasDuplicateSortOrder<T extends SortableRow>(items: T[]) {
  const seen = new Set<number>();
  for (const item of items) {
    if (seen.has(item.sort_order)) return true;
    seen.add(item.sort_order);
  }
  return false;
}

export function hasGapsInSortOrder<T extends SortableRow>(items: T[]) {
  if (items.length === 0) return false;
  const ordered = sortByOrder(items);
  return ordered.some((item, index) => item.sort_order !== index + 1);
}

/** Atualiza o cache na hora e persiste em paralelo no Supabase. */
export async function persistOrderOptimistic<T extends SortableRow>(
  qc: QueryClient,
  queryKey: readonly unknown[],
  table: OrderableTable,
  items: T[],
) {
  const previous = qc.getQueryData<T[]>(queryKey);
  qc.setQueryData(queryKey, applySortOrders(items));

  try {
    await persistTableOrder(table, items);
  } catch (err) {
    if (previous !== undefined) {
      qc.setQueryData(queryKey, previous);
    } else {
      await qc.invalidateQueries({ queryKey: [...queryKey] });
    }
    throw err;
  }
}

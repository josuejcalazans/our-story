import { parseStoryDate } from "@/lib/story-date";

export type TimelineSortable = {
  id: string;
  sort_order: number;
  date_text: string;
  title?: string;
};

function compareByDate(a: TimelineSortable, b: TimelineSortable) {
  const dateA = parseStoryDate(a.date_text);
  const dateB = parseStoryDate(b.date_text);

  if (dateA && dateB) {
    const diff = dateA.getTime() - dateB.getTime();
    if (diff !== 0) return diff;
  } else if (dateA) return -1;
  else if (dateB) return 1;

  return a.sort_order - b.sort_order;
}

/** Ordem manual (sort_order), com desempate por data. */
export function sortTimelineEvents<T extends TimelineSortable>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderDiff = a.sort_order - b.sort_order;
    if (orderDiff !== 0) return orderDiff;
    return compareByDate(a, b);
  });
}

/** Cronológica: mais antigo → mais recente (ideal para a linha do tempo). */
export function sortTimelineByDate<T extends TimelineSortable>(items: T[]): T[] {
  return [...items].sort(compareByDate);
}

export function countUnparseableTimelineDates<T extends TimelineSortable>(items: T[]) {
  return items.filter((item) => !parseStoryDate(item.date_text)).length;
}

export type GallerySortable = {
  id: string;
  sort_order: number;
  taken_at: string | null;
  created_at?: string;
};

/** Ordem manual primeiro; empate por data da foto */
export function sortGalleryImages<T extends GallerySortable>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    const orderDiff = a.sort_order - b.sort_order;
    if (orderDiff !== 0) return orderDiff;

    if (a.taken_at && b.taken_at) {
      const dateDiff = a.taken_at.localeCompare(b.taken_at);
      if (dateDiff !== 0) return dateDiff;
    } else if (a.taken_at) return -1;
    else if (b.taken_at) return 1;

    if (a.created_at && b.created_at) {
      return a.created_at.localeCompare(b.created_at);
    }
    return 0;
  });
}

export function sortGalleryByDate<T extends GallerySortable>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    if (a.taken_at && b.taken_at) {
      const dateDiff = a.taken_at.localeCompare(b.taken_at);
      if (dateDiff !== 0) return dateDiff;
    } else if (a.taken_at) return -1;
    else if (b.taken_at) return 1;
    return a.sort_order - b.sort_order;
  });
}

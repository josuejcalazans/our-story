import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import type { GalleryImage } from "@/lib/use-site-content";

function useColumnCount() {
  const [count, setCount] = useState(2);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setCount(mq.matches ? 3 : 2);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return count;
}

function splitIntoOrderedColumns<T>(items: T[], columnCount: number): T[][] {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  for (let i = 0; i < items.length; i++) {
    columns[i % columnCount].push(items[i]);
  }
  return columns;
}

type GalleryTileProps = {
  img: GalleryImage;
  index: number;
  onOpen: (index: number) => void;
};

function GalleryTile({ img, index, onOpen }: GalleryTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 6) * 0.06, duration: 0.55, ease: "easeOut" }}
      className="group"
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        className="relative w-full cursor-zoom-in rounded-[1.35rem] p-2 text-left transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="absolute inset-0 rounded-[1.35rem] border-2 border-transparent transition-all duration-500 group-hover:border-primary/45 group-hover:shadow-[0_0_32px_-6px_var(--primary)]" />
        <div className="relative overflow-hidden rounded-2xl bg-white/5">
          <img
            src={img.image_url}
            alt={img.caption || img.title || "Foto da galeria"}
            loading="lazy"
            className="block w-full h-auto transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute right-3 top-3 flex h-9 w-9 scale-90 items-center justify-center rounded-full bg-black/45 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <ZoomIn className="h-4 w-4 text-white" />
          </div>
          {(img.title || img.caption || img.taken_at) && (
            <div className="absolute inset-x-0 bottom-0 translate-y-1 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              {(img.title || img.caption) && (
                <p className="font-letter text-sm italic text-white">{img.title || img.caption}</p>
              )}
              {img.taken_at && (
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/65">
                  {new Date(`${img.taken_at}T12:00:00`).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}

export default function GalleryMasonry({
  images,
  onOpen,
}: {
  images: GalleryImage[];
  onOpen: (index: number) => void;
}) {
  const columnCount = useColumnCount();

  const columns = useMemo(() => {
    const items = images.map((img, index) => ({ img, index }));
    return splitIntoOrderedColumns(items, columnCount);
  }, [images, columnCount]);

  return (
    <div className="mt-10 flex items-start gap-4 sm:gap-5">
      {columns.map((column, colIdx) => (
        <div key={`gallery-col-${colIdx}`} className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
          {column.map(({ img, index }) => (
            <GalleryTile key={img.id} img={img} index={index} onOpen={onOpen} />
          ))}
        </div>
      ))}
    </div>
  );
}

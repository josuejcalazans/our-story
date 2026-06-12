import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";

export const STORY_CHAPTERS = [
  { id: "chapter-hero", label: "Início" },
  { id: "chapter-time", label: "Tempo" },
  { id: "chapter-timeline", label: "História" },
  { id: "chapter-gallery", label: "Fotos" },
  { id: "chapter-notes", label: "Mensagens" },
  { id: "chapter-letter", label: "Carta" },
  { id: "chapter-memories", label: "Memórias" },
  { id: "chapter-final", label: "Final" },
] as const;

export default function ChapterNav() {
  const [active, setActive] = useState(STORY_CHAPTERS[0].id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const elements = STORY_CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const el of elements) observer.observe(el!);
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }

  const NavItems = ({ vertical = true }: { vertical?: boolean }) => (
    <ul className={vertical ? "flex flex-col gap-1" : "flex flex-wrap justify-center gap-2"}>
      {STORY_CHAPTERS.map((chapter) => {
        const isActive = active === chapter.id;
        return (
          <li key={chapter.id}>
            <button
              type="button"
              onClick={() => scrollTo(chapter.id)}
              className={`group flex items-center gap-2 rounded-full px-3 py-2 text-left text-[11px] tracking-wide transition-all cursor-pointer ${
                isActive
                  ? "bg-accent/20 text-accent shadow-glow"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                  isActive ? "scale-125 bg-accent shadow-[0_0_8px_var(--romance)]" : "bg-white/25 group-hover:bg-white/50"
                }`}
              />
              {chapter.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <nav
        aria-label="Capítulos da história"
        className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      >
        <div className="glass rounded-2xl border border-white/10 p-2 shadow-soft">
          <NavItems />
        </div>
      </nav>

      <div className="fixed bottom-24 left-4 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background/90 text-accent shadow-glow backdrop-blur-md cursor-pointer"
          aria-label="Abrir capítulos"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed bottom-36 left-4 z-40 lg:hidden"
          >
            <div className="glass max-h-[50vh] overflow-y-auto rounded-2xl border border-white/10 p-3 shadow-glow">
              <p className="mb-2 flex items-center gap-1.5 px-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <Heart className="h-3 w-3 fill-accent/50 text-accent/50" />
                Capítulos
              </p>
              <NavItems vertical />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

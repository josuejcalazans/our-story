import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const FALLBACK_NOTES = [
  "Seu sorriso.",
  "Seu jeito de me olhar.",
  "Sua risada.",
  "Como você acredita em mim.",
  "Como transforma dias comuns em momentos especiais.",
];

export default function MessageWall({
  notes,
  id = "chapter-notes",
}: {
  notes: { id: string; text: string }[];
  id?: string;
}) {
  const items = notes.length ? notes : FALLBACK_NOTES.map((text, i) => ({ id: String(i), text }));

  return (
    <section id={id} className="relative px-6 py-24 scroll-mt-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          Capítulo especial
        </p>
        <h2 className="mt-4 text-center font-display text-4xl text-glow sm:text-5xl">
          Pequenas coisas que eu amo em você
        </h2>
        <div className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 6) * 0.08, duration: 0.65 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="mb-4 break-inside-avoid"
            >
              <div className="glass group relative overflow-hidden rounded-2xl p-5 shadow-soft transition-shadow hover:shadow-glow">
                <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
                <Heart className="mb-3 h-4 w-4 fill-accent/40 text-accent/60" aria-hidden />
                <p className="font-script text-2xl leading-snug text-foreground">{note.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

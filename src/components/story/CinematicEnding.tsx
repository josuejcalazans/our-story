import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

const LINES = [
  "Para todos os capítulos que já vivemos...",
  "E para todos os que ainda vamos escrever.",
  "Eu te amo",
] as const;

function RisingParticles() {
  const particles = Array.from({ length: 24 }, (_, id) => ({
    id,
    left: (id * 17) % 100,
    delay: (id % 8) * 0.4,
    duration: 5 + (id % 5),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute bottom-0 text-accent/50"
          style={{ left: `${p.left}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: "-90vh", opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
        >
          <Heart className="h-4 w-4 fill-current" />
        </motion.span>
      ))}
    </div>
  );
}

export default function CinematicEnding({
  active,
  onRestart,
}: {
  active: boolean;
  onRestart: () => void;
}) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!active) {
      setLine(0);
      return;
    }
    if (line >= LINES.length - 1) return;
    const t = setTimeout(() => setLine((l) => l + 1), 2800);
    return () => clearTimeout(t);
  }, [active, line]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070014]/95 px-6 backdrop-blur-md"
        >
          <RisingParticles />
          <div className="relative z-10 max-w-xl text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                transition={{ duration: 0.8 }}
                className="font-letter text-2xl italic leading-relaxed text-foreground sm:text-3xl"
              >
                {LINES[line]}
                {line === LINES.length - 1 && (
                  <>
                    {" "}
                    <Heart
                      aria-hidden
                      className="inline-block h-[0.85em] w-[0.85em] shrink-0 fill-accent text-accent drop-shadow-[0_0_20px_rgba(236,72,153,0.55)]"
                      style={{ verticalAlign: "-0.08em" }}
                    />
                  </>
                )}
              </motion.p>
            </AnimatePresence>

            {line === LINES.length - 1 && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                onClick={onRestart}
                className="mt-12 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-8 py-4 text-sm font-medium text-accent shadow-glow transition-all hover:bg-accent/25 cursor-pointer"
              >
                <Heart className="h-4 w-4 fill-current" />
                Recomeçar nossa história
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

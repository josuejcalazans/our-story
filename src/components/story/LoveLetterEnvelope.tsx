import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

type Phase = "closed" | "opening" | "open";

export default function LoveLetterEnvelope({ letter }: { letter: string }) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [text, setText] = useState("");

  useEffect(() => {
    if (phase !== "open") return;
    setText("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(letter.slice(0, i));
      if (i >= letter.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [phase, letter]);

  function handleOpen() {
    if (phase !== "closed") return;
    setPhase("opening");
    setTimeout(() => setPhase("open"), 900);
  }

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <AnimatePresence mode="wait">
        {phase !== "open" ? (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(6px)" }}
            className="flex flex-col items-center"
          >
            <button
              type="button"
              onClick={handleOpen}
              disabled={phase === "opening"}
              className="group relative w-full max-w-sm cursor-pointer disabled:cursor-wait"
              aria-label="Abrir carta"
            >
              <div className="relative mx-auto aspect-[4/3] w-full max-w-xs">
                {/* Corpo do envelope */}
                <div className="absolute inset-x-0 bottom-0 h-[72%] rounded-b-2xl bg-gradient-to-b from-[#2a1838] to-[#1a0f28] border border-white/10 shadow-soft" />

                {/* Aba superior */}
                <motion.div
                  className="absolute inset-x-0 top-[18%] z-20 origin-top"
                  animate={phase === "opening" ? { rotateX: 160, y: -8 } : { rotateX: 0 }}
                  transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                  style={{ transformStyle: "preserve-3d", perspective: 800 }}
                >
                  <div
                    className="mx-auto h-0 w-0 border-x-[min(42vw,9.5rem)] border-x-transparent border-t-[min(28vw,6.5rem)] border-t-[#3d2550]"
                    style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
                  />
                </motion.div>

                {/* Carta escondida */}
                <motion.div
                  className="absolute inset-x-4 bottom-4 z-10 rounded-lg bg-[#f8f0e8] shadow-inner"
                  animate={phase === "opening" ? { y: -40, opacity: 0.6 } : { y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  style={{ height: "55%" }}
                />

                {/* Selo de cera */}
                <motion.div
                  className="absolute left-1/2 top-[46%] z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#db2777] shadow-glow ring-2 ring-accent/30"
                  animate={phase === "opening" ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Heart className="h-6 w-6 fill-white text-white" />
                </motion.div>
              </div>

              <p className="mt-8 font-letter text-lg italic text-muted-foreground">
                Tem algo escrito só para você...
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-8 py-3 text-sm font-medium text-accent shadow-glow transition-all group-hover:bg-accent/25">
                Abrir Carta
              </span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="letter"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="paper-texture glass rounded-3xl border border-white/10 p-8 shadow-soft sm:p-12"
          >
            <pre className="whitespace-pre-wrap font-script text-2xl leading-relaxed text-foreground sm:text-3xl">
              {text}
              {text.length < letter.length && (
                <span
                  className="ml-0.5 inline-block w-[2px] bg-accent align-middle"
                  style={{ height: "1em", animation: "blink 1s steps(2) infinite" }}
                />
              )}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

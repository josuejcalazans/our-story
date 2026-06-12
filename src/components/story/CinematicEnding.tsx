import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import {
  playEndingSurpriseAudio,
  stopEndingSurpriseAudio,
} from "@/lib/ending-audio-session";

const LINES = [
  "Para todos os capítulos que já vivemos...",
  "E para todos os que ainda vamos escrever.",
  "Eu te amo",
  "Para todo sempre, minha deusa",
] as const;

/** Tempo com a frase na tela após a animação de entrada (~0.5s) */
const LINE_DWELL_MS = [5200, 4500, 4000, 6500];
const LINE_ENTER_MS = 500;

function RisingParticles() {
  const particles = Array.from({ length: 28 }, (_, id) => ({
    id,
    left: (id * 17) % 100,
    delay: (id % 8) * 0.35,
    duration: 5 + (id % 5),
    size: 12 + (id % 3) * 4,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute bottom-0 text-accent/40"
          style={{ left: `${p.left}%` }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: "-92vh", opacity: [0, 0.7, 0], scale: [0.6, 1, 0.8] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        >
          <Heart style={{ width: p.size, height: p.size }} className="fill-current" />
        </motion.span>
      ))}
    </div>
  );
}

function CinematicGlow() {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8 }}
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 45%, oklch(0.55 0.18 320 / 0.22), transparent 70%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.72 0.21 350 / 0.12), transparent 55%)",
        }}
      />
    </>
  );
}

function ChaptersLine({ text, onRevealed }: { text: string; onRevealed: () => void }) {
  const words = text.split(" ");
  const revealed = useRef(false);

  function handleLastWordComplete() {
    if (revealed.current) return;
    revealed.current = true;
    onRevealed();
  }

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-xl text-center font-letter text-2xl italic leading-relaxed text-foreground sm:text-3xl"
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 28, filter: "blur(14px)", scale: 0.92 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          transition={{
            delay: 0.35 + i * 0.11,
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={i === words.length - 1 ? handleLastWordComplete : undefined}
          className="mr-[0.32em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}

function FutureLine({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-xl text-center font-letter text-2xl italic leading-relaxed text-foreground sm:text-3xl"
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{
            opacity: 0,
            x: i % 2 === 0 ? -36 : 36,
            letterSpacing: "0.2em",
            filter: "blur(10px)",
          }}
          animate={{
            opacity: 1,
            x: 0,
            letterSpacing: "0em",
            filter: "blur(0px)",
          }}
          transition={{
            delay: i * 0.1,
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mr-[0.32em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}

function LoveLine({ text, showHeart = true }: { text: string; showHeart?: boolean }) {
  const chars = [...text];
  const charDelay = 0.09;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-2"
    >
      <span
        aria-label={text}
        className="flex items-center justify-center font-display text-4xl leading-none sm:text-5xl md:text-6xl"
      >
        {chars.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            initial={{ opacity: 0, scale: 0.4, filter: "blur(16px)" }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              textShadow: [
                "0 0 0px oklch(0.74 0.21 350 / 0)",
                "0 0 28px oklch(0.74 0.21 350 / 0.55)",
                "0 0 12px oklch(0.74 0.21 350 / 0.35)",
              ],
            }}
            transition={{
              delay: 0.2 + i * charDelay,
              duration: 0.7,
              ease: [0.34, 1.4, 0.64, 1],
            }}
            className="romantic-gradient-text inline-block"
            style={{ width: char === " " ? "0.35em" : undefined }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
      {showHeart && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: [0, 1.25, 1] }}
          transition={{ delay: 0.2 + chars.length * charDelay + 0.15, duration: 0.6 }}
          className="flex shrink-0 items-center justify-center"
        >
          <Heart
            aria-hidden
            className="h-9 w-9 fill-accent text-accent drop-shadow-[0_0_24px_rgba(236,72,153,0.65)] sm:h-11 sm:w-11 md:h-12 md:w-12"
          />
        </motion.span>
      )}
    </motion.div>
  );
}

function GoddessLine({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-2"
    >
      <p
        aria-label={text}
        className="mx-auto max-w-xl text-center font-letter text-2xl italic leading-relaxed text-foreground/95 sm:text-3xl md:text-4xl"
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.25 + i * 0.12,
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mr-[0.32em] inline-block"
          >
            {word}
          </motion.span>
        ))}
      </p>
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: [0, 1.2, 1] }}
        transition={{ delay: 0.25 + words.length * 0.12 + 0.2, duration: 0.6 }}
        className="flex shrink-0 items-center justify-center"
      >
        <Heart
          aria-hidden
          className="h-8 w-8 fill-accent/90 text-accent drop-shadow-[0_0_20px_rgba(236,72,153,0.5)] sm:h-9 sm:w-9"
        />
      </motion.span>
    </motion.div>
  );
}

function EndingLineContent({
  index,
  onFirstLineRevealed,
}: {
  index: number;
  onFirstLineRevealed: () => void;
}) {
  const text = LINES[index];

  if (index === 0) return <ChaptersLine text={text} onRevealed={onFirstLineRevealed} />;
  if (index === 1) return <FutureLine text={text} />;
  if (index === 2) return <LoveLine text={text} />;
  return <GoddessLine text={text} />;
}

export default function CinematicEnding({
  active,
  audioUrl,
  onRestart,
}: {
  active: boolean;
  audioUrl?: string | null;
  onRestart: () => void;
}) {
  const [line, setLine] = useState(0);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const audioStarted = useRef(false);

  useEffect(() => {
    if (!active) {
      stopEndingSurpriseAudio();
      setLine(0);
      setCurtainOpen(false);
      audioStarted.current = false;
      return;
    }

    const open = window.setTimeout(() => setCurtainOpen(true), 500);
    return () => {
      window.clearTimeout(open);
      stopEndingSurpriseAudio();
    };
  }, [active]);

  useEffect(() => {
    if (!active || !curtainOpen) return;
    if (line >= LINES.length - 1) return;

    const dwell = LINE_DWELL_MS[line] ?? 4000;
    const t = window.setTimeout(() => {
      setLine((current) => (current < LINES.length - 1 ? current + 1 : current));
    }, dwell);
    return () => window.clearTimeout(t);
  }, [active, curtainOpen, line]);

  function handleFirstLineRevealed() {
    if (audioStarted.current || !audioUrl?.trim()) return;
    audioStarted.current = true;
    void playEndingSurpriseAudio(audioUrl);
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#070014]/96 px-6 backdrop-blur-md"
        >
          <CinematicGlow />
          <RisingParticles />

          {/* Cortina de abertura */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 bg-[#070014]"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: curtainOpen ? 0 : 1 }}
            transition={{ duration: 1.1, ease: [0.77, 0, 0.18, 1] }}
            style={{ transformOrigin: "top" }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 bg-[#070014]"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: curtainOpen ? 0 : 1 }}
            transition={{ duration: 1.1, ease: [0.77, 0, 0.18, 1], delay: 0.05 }}
            style={{ transformOrigin: "bottom" }}
          />

          <div className="relative z-30 flex w-full max-w-3xl flex-1 items-center justify-center px-4">
            <AnimatePresence mode="wait" initial={false}>
              {curtainOpen && (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: LINE_ENTER_MS / 1000, ease: "easeInOut" }}
                  className="flex w-full items-center justify-center px-4 text-center"
                >
                  <EndingLineContent
                    index={line}
                    onFirstLineRevealed={handleFirstLineRevealed}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {curtainOpen && line === LINES.length - 1 && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 1.4, duration: 0.8 }}
              onClick={() => {
                stopEndingSurpriseAudio();
                onRestart();
              }}
              className="absolute bottom-[12vh] left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-8 py-4 text-sm font-medium text-accent shadow-glow transition-all hover:bg-accent/25 cursor-pointer"
            >
              <Heart className="h-4 w-4 fill-current" />
              Recomeçar nossa história
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

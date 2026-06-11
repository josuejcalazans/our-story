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
] as const;

const LINE_DWELL_MS = [4800, 4200, 5200];

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
      className="font-letter text-2xl italic leading-relaxed text-foreground sm:text-3xl"
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
      className="font-letter text-2xl italic leading-relaxed text-foreground sm:text-3xl"
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

function LoveLine({ text }: { text: string }) {
  const chars = [...text];

  return (
    <motion.p
      className="font-display text-4xl leading-tight sm:text-5xl md:text-6xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
            delay: 0.2 + i * 0.09,
            duration: 0.7,
            ease: [0.34, 1.4, 0.64, 1],
          }}
          className="romantic-gradient-text inline-block"
          style={{ width: char === " " ? "0.35em" : undefined }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: [0, 1.25, 1] }}
        transition={{ delay: 0.2 + chars.length * 0.09 + 0.15, duration: 0.6 }}
        className="ml-2 inline-block align-middle"
      >
        <Heart
          aria-hidden
          className="inline-block h-[0.85em] w-[0.85em] fill-accent text-accent drop-shadow-[0_0_24px_rgba(236,72,153,0.65)]"
        />
      </motion.span>
    </motion.p>
  );
}

function EndingLine({
  index,
  onFirstLineRevealed,
}: {
  index: number;
  onFirstLineRevealed: () => void;
}) {
  const text = LINES[index];

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20, filter: "blur(10px)", scale: 0.98 }}
      transition={{ duration: 0.65, ease: "easeInOut" }}
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-2"
    >
      {index === 0 && <ChaptersLine text={text} onRevealed={onFirstLineRevealed} />}
      {index === 1 && <FutureLine text={text} />}
      {index === 2 && <LoveLine text={text} />}
    </motion.div>
  );
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

    const t = window.setTimeout(() => setLine((l) => l + 1), LINE_DWELL_MS[line]);
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
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#070014]/96 px-6 backdrop-blur-md"
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

          <div className="relative z-30 mx-auto h-[40vh] w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {curtainOpen && (
                <EndingLine index={line} onFirstLineRevealed={handleFirstLineRevealed} />
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
              className="absolute bottom-[12vh] z-30 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-8 py-4 text-sm font-medium text-accent shadow-glow transition-all hover:bg-accent/25 cursor-pointer"
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

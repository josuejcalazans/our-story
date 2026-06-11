import { motion } from "framer-motion";
import { Heart } from "lucide-react";

/** Tempo mínimo na tela antes de mostrar senha ou história */
export const STORY_LOADER_MIN_MS = 3200;

const BEAT_DURATION = 2.4;

export default function StoryHeartbeatLoader({
  message = "Preparando nossa história...",
}: {
  message?: string;
}) {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-glow" />
      <div className="relative z-10 flex flex-col items-center gap-10 px-6">
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center"
          animate={{ scale: [1, 1.28, 1, 1.14, 1, 1.06, 1] }}
          transition={{
            duration: BEAT_DURATION,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            times: [0, 0.12, 0.22, 0.34, 0.44, 0.58, 1],
          }}
        >
          <Heart className="relative z-10 h-12 w-12 fill-accent text-accent drop-shadow-[0_0_28px_oklch(0.74_0.21_350_/_0.55)]" />
          <motion.span
            className="absolute inset-0 rounded-full border border-accent/50"
            animate={{ scale: [0.85, 1.55], opacity: [0.55, 0] }}
            transition={{
              duration: BEAT_DURATION,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
              times: [0.1, 1],
            }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-primary/40"
            animate={{ scale: [0.9, 1.35], opacity: [0.4, 0] }}
            transition={{
              duration: BEAT_DURATION,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
              delay: 0.45,
              times: [0.1, 1],
            }}
          />
        </motion.div>

        <div className="relative w-56 max-w-[70vw]">
          <svg
            viewBox="0 0 280 56"
            className="h-12 w-full text-accent/90"
            aria-hidden
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ecg-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(0.74 0.21 350 / 0)" />
                <stop offset="45%" stopColor="oklch(0.74 0.21 350 / 0.9)" />
                <stop offset="100%" stopColor="oklch(0.66 0.25 305 / 0.2)" />
              </linearGradient>
            </defs>
            <path
              d="M0 28 H72 L82 10 L92 46 L102 28 H148 L158 18 L168 28 H280"
              fill="none"
              stroke="url(#ecg-glow)"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ecg-line"
            />
          </svg>
          <div className="ecg-scan-line pointer-events-none absolute inset-y-0 left-0 w-8" />
        </div>

        <motion.p
          className="font-letter text-center text-sm italic text-muted-foreground"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}

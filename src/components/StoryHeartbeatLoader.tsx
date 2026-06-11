import { motion } from "framer-motion";
import { Heart, Volume2, VolumeX } from "lucide-react";
import { useHeartbeatSound } from "@/hooks/use-heartbeat-sound";
import { HEARTBEAT_CYCLE_MS } from "@/lib/heartbeat-sound";

/** Tempo mínimo na tela antes de mostrar senha ou história */
export const STORY_LOADER_MIN_MS = 3200;

const BEAT_DURATION = HEARTBEAT_CYCLE_MS / 1000;

export default function StoryHeartbeatLoader({
  message = "Preparando nossa história...",
  sound = true,
}: {
  message?: string;
  sound?: boolean;
}) {
  const { muted, unlocked, needsTap, mute, unmuteFromGesture, unlockFromGesture } =
    useHeartbeatSound(sound);

  return (
    <div
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background"
      onPointerDown={() => {
        if (sound && !muted) unlockFromGesture();
      }}
      role="presentation"
    >
      <div className="absolute inset-0 bg-glow" />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (muted) unmuteFromGesture();
          else mute();
        }}
        aria-label={muted ? "Ativar som do coração" : "Silenciar som do coração"}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground cursor-pointer"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

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

        {sound && needsTap && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-center text-xs text-accent"
          >
            Toque em qualquer lugar para ouvir o coração
          </motion.p>
        )}

        {sound && unlocked && !muted && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
            Batimento ativo
          </p>
        )}
      </div>
    </div>
  );
}

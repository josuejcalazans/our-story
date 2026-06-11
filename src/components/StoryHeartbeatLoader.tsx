import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Volume2, VolumeX } from "lucide-react";
import EcgContinuousLine from "@/components/EcgContinuousLine";
import { useHeartbeatSound } from "@/hooks/use-heartbeat-sound";
import {
  cycleMsToBpm,
  getHeartPulseScale,
  getHeartbeatCycleMs,
  HEARTBEAT_ACCELERATE_AT_MS,
  HEARTBEAT_INITIAL_FLAT_MS,
  STORY_LOADER_MIN_MS,
} from "@/lib/heartbeat-loader-timing";

export { STORY_LOADER_MIN_MS };

function useLoaderElapsedMs(active: boolean) {
  const startRef = useRef(performance.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) return;
    startRef.current = performance.now();
    setElapsedMs(0);
    let raf = 0;
    const tick = () => {
      setElapsedMs(performance.now() - startRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return {
    elapsedMs,
    getElapsedMs: useCallback(() => performance.now() - startRef.current, []),
  };
}

export default function StoryHeartbeatLoader({
  message = "Algo está batendo mais forte...",
  sound = true,
  onComplete,
}: {
  message?: string;
  sound?: boolean;
  onComplete?: () => void;
}) {
  const { elapsedMs, getElapsedMs } = useLoaderElapsedMs(true);
  const running = elapsedMs < STORY_LOADER_MIN_MS;
  const accelerating = elapsedMs >= HEARTBEAT_ACCELERATE_AT_MS;
  const completedRef = useRef(false);

  const [beatKey, setBeatKey] = useState(0);
  const [heartScale, setHeartScale] = useState(1);
  const [rippleKey, setRippleKey] = useState(0);

  const { muted, mute, unmute, playBeat, stopAll } = useHeartbeatSound(sound && running);

  const playBeatRef = useRef(playBeat);
  playBeatRef.current = playBeat;

  useEffect(() => {
    if (!running) stopAll();
  }, [running, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  useEffect(() => {
    if (elapsedMs < STORY_LOADER_MIN_MS || completedRef.current) return;
    completedRef.current = true;
    stopAll();
    onComplete?.();
  }, [elapsedMs, onComplete, stopAll]);

  useEffect(() => {
    if (!running) return;

    let beatTimeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;

      const elapsed = getElapsedMs();
      if (elapsed >= STORY_LOADER_MIN_MS) return;

      const cycleMs = getHeartbeatCycleMs(elapsed);
      const bpm = cycleMsToBpm(cycleMs);

      setBeatKey((k) => k + 1);
      setRippleKey((k) => k + 1);

      const scale = getHeartPulseScale(bpm);
      setHeartScale(scale);
      setTimeout(() => setHeartScale(1), 85);

      if (cancelled || getElapsedMs() >= STORY_LOADER_MIN_MS) return;
      playBeatRef.current(bpm);

      if (cancelled) return;
      beatTimeout = setTimeout(scheduleNext, cycleMs);
    };

    beatTimeout = setTimeout(scheduleNext, HEARTBEAT_INITIAL_FLAT_MS);

    return () => {
      cancelled = true;
      if (beatTimeout) clearTimeout(beatTimeout);
    };
  }, [running, getElapsedMs]);

  return (
    <div
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background touch-manipulation"
      role="presentation"
    >
      <div className="absolute inset-0 bg-glow" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (muted) unmute();
          else mute();
        }}
        aria-label={muted ? "Ativar som do coração" : "Silenciar som do coração"}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground opacity-20 transition-opacity hover:bg-white/10 hover:text-foreground hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      <div className="relative z-10 flex flex-col items-center gap-10 px-6">
        <div
          className="relative flex h-20 w-20 items-center justify-center"
          style={{
            transform: `scale(${heartScale})`,
            transition: heartScale > 1 ? "transform 0.07s ease-out" : "transform 0.2s ease-in",
            willChange: "transform",
          }}
        >
          <Heart className="relative z-10 h-12 w-12 fill-accent text-accent drop-shadow-[0_0_28px_oklch(0.74_0.21_350_/_0.55)]" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={rippleKey}
              className="absolute inset-0 rounded-full border border-accent/50"
              initial={{ scale: 0.85, opacity: 0.55 }}
              animate={{ scale: 1.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <motion.span
              key={`${rippleKey}-2`}
              className="absolute inset-0 rounded-full border border-accent/35"
              initial={{ scale: 0.85, opacity: 0.35 }}
              animate={{ scale: 2.3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.09 }}
            />
          </AnimatePresence>
        </div>

        <EcgContinuousLine elapsedMs={elapsedMs} beatKey={beatKey} running={running} />

        <motion.p
          className="font-letter text-center text-sm italic text-muted-foreground"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          {message}
        </motion.p>

        {accelerating && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="text-[10px] uppercase tracking-[0.25em] text-accent/70"
          >
            O coração acelera...
          </motion.p>
        )}
      </div>
    </div>
  );
}

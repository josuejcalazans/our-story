import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Volume2, VolumeX } from "lucide-react";
import EcgContinuousLine from "@/components/EcgContinuousLine";
import { useHeartbeatSound } from "@/hooks/use-heartbeat-sound";
import {
  buildBeatSchedule,
  getHeartScale,
  HEARTBEAT_ACCELERATE_AT_MS,
  STORY_LOADER_MIN_MS,
} from "@/lib/heartbeat-loader-timing";

export { STORY_LOADER_MIN_MS };

function useLoaderElapsedMs() {
  const startRef = useRef(performance.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const tick = () => setElapsedMs(performance.now() - startRef.current);
    tick();
    const id = window.setInterval(tick, 32);
    return () => window.clearInterval(id);
  }, []);

  return { elapsedMs, getElapsedMs: useCallback(() => performance.now() - startRef.current, []) };
}

export default function StoryHeartbeatLoader({
  message = "Preparando nossa história...",
  sound = true,
}: {
  message?: string;
  sound?: boolean;
}) {
  const { elapsedMs, getElapsedMs } = useLoaderElapsedMs();
  const beatSchedule = useMemo(() => buildBeatSchedule(), []);
  const heartScale = getHeartScale(elapsedMs, beatSchedule);
  const accelerating = elapsedMs >= HEARTBEAT_ACCELERATE_AT_MS;

  const lastLubRef = useRef(-1);
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    const lubs = beatSchedule.filter((b) => b.kind === "lub");
    for (let i = 0; i < lubs.length; i++) {
      const lub = lubs[i];
      if (!lub) continue;
      if (elapsedMs >= lub.atMs && elapsedMs < lub.atMs + 60 && lastLubRef.current !== i) {
        lastLubRef.current = i;
        setRippleKey(i);
        break;
      }
    }
  }, [elapsedMs, beatSchedule]);

  const { muted, unlocked, needsTap, mute, unmuteFromGesture, unlockFromGesture } =
    useHeartbeatSound(sound, getElapsedMs);

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
        <div
          className="relative flex h-20 w-20 items-center justify-center"
          style={{ transform: `scale(${heartScale})`, willChange: "transform" }}
        >
          <Heart className="relative z-10 h-12 w-12 fill-accent text-accent drop-shadow-[0_0_28px_oklch(0.74_0.21_350_/_0.55)]" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={rippleKey}
              className="absolute inset-0 rounded-full border border-accent/50"
              initial={{ scale: 0.85, opacity: 0.55 }}
              animate={{ scale: 1.55, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          </AnimatePresence>
        </div>

        <EcgContinuousLine elapsedMs={elapsedMs} />

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

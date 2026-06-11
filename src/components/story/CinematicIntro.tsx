import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import EcgContinuousLine from "@/components/EcgContinuousLine";
import { useHeartbeatSound } from "@/hooks/use-heartbeat-sound";
import { unlockHeartbeatAudio } from "@/lib/heartbeat-audio-session";
import {
  CINEMATIC_HEART_MS,
  cycleMsToBpm,
  getHeartPulseScale,
  getHeartbeatAudioStopAtMs,
  getHeartbeatCycleMs,
  HEARTBEAT_INITIAL_FLAT_MS,
  STORY_LOADER_MIN_MS,
} from "@/lib/heartbeat-loader-timing";
import { fadeOutHeartbeatAudioSession } from "@/lib/heartbeat-audio-session";

export { STORY_LOADER_MIN_MS };

const STAGE_1_MS = 2500;
const STAGE_2_MS = 8000;
const STAGE_3_MS = 5000;
const STAGE_4_MS = 3500;
const STAGE_5_MS = 3200;
const STAGE_6_MS = 10000;

const EMOTIONAL_PHRASES = [
  "Lembrando nosso primeiro encontro...",
  "Revisitando nossas viagens...",
  "Organizando nossas fotos...",
  "Guardando tudo para sempre...",
] as const;

const BEAT_LINES = [
  { key: "title", text: "Primeiro batimento", className: "text-[11px] uppercase tracking-[0.35em] text-secondary" },
  { key: "lub", text: "lub... dub...", className: "font-display text-2xl text-glow sm:text-3xl" },
  { key: "grow", text: "O coração cresce junto com o som.", className: "font-letter text-lg italic text-muted-foreground sm:text-xl" },
  { key: "stronger", text: "Algo está batendo mais forte...", className: "font-letter text-lg italic text-muted-foreground sm:text-xl" },
] as const;

type Stage = 1 | 2 | 3 | 4 | 5 | 6;

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

function EmotionalProgress({ phraseIdx }: { phraseIdx: number }) {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#EC4899]"
          animate={{ x: ["-100%", "120%"] }}
          transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          style={{ width: "40%" }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={phraseIdx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.7 }}
          className="mt-8 font-letter text-lg italic leading-relaxed text-muted-foreground sm:text-xl"
        >
          {EMOTIONAL_PHRASES[phraseIdx % EMOTIONAL_PHRASES.length]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>(1);
  const [beatLine, setBeatLine] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [flash, setFlash] = useState(false);

  const heartActive = stage >= 2 && stage <= 4;
  const { elapsedMs, getElapsedMs } = useLoaderElapsedMs(heartActive);
  const audioStopAtMs = getHeartbeatAudioStopAtMs(CINEMATIC_HEART_MS);
  const running = heartActive && elapsedMs < audioStopAtMs;

  const [beatKey, setBeatKey] = useState(0);
  const [heartScale, setHeartScale] = useState(1);
  const [rippleKey, setRippleKey] = useState(0);
  const { playBeat, fadeOut } = useHeartbeatSound();
  const playBeatRef = useRef(playBeat);
  playBeatRef.current = playBeat;
  const completedRef = useRef(false);
  const fadingRef = useRef(false);

  useEffect(() => {
    const unlock = () => void unlockHeartbeatAudio();
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    return () => {
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);

  useEffect(() => {
    if (stage !== 2) {
      setBeatLine(0);
      return;
    }
    const timers = [
      setTimeout(() => setBeatLine(1), 1800),
      setTimeout(() => setBeatLine(2), 4200),
      setTimeout(() => setBeatLine(3), 6600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  useEffect(() => {
    const durations: Record<Stage, number> = {
      1: STAGE_1_MS,
      2: STAGE_2_MS,
      3: STAGE_3_MS,
      4: STAGE_4_MS,
      5: STAGE_5_MS,
      6: STAGE_6_MS,
    };

    if (stage === 4) return;

    const t = setTimeout(() => {
      if (stage < 6) setStage((stage + 1) as Stage);
    }, durations[stage]);

    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 4 || fadingRef.current) return;

    if (elapsedMs < audioStopAtMs) return;

    fadingRef.current = true;
    void fadeOut().then(() => {
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setStage(5);
      }, 450);
    });
  }, [stage, elapsedMs, audioStopAtMs, fadeOut]);

  useEffect(() => {
    if (stage !== 6) return;
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % EMOTIONAL_PHRASES.length), 2800);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== 6) return;
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, STAGE_6_MS);
    return () => clearTimeout(t);
  }, [stage, onComplete]);

  useEffect(() => {
    if (!running) return;
    let beatTimeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;
      const elapsed = getElapsedMs();
      if (elapsed >= audioStopAtMs) return;

      const cycleMs = getHeartbeatCycleMs(elapsed, CINEMATIC_HEART_MS);
      const bpm = cycleMsToBpm(cycleMs);
      setBeatKey((k) => k + 1);
      setRippleKey((k) => k + 1);
      setHeartScale(getHeartPulseScale(bpm));
      setTimeout(() => setHeartScale(1), 90);

      if (!cancelled && elapsed < audioStopAtMs) playBeatRef.current(bpm);
      if (cancelled) return;
      beatTimeout = setTimeout(scheduleNext, cycleMs);
    };

    beatTimeout = setTimeout(scheduleNext, HEARTBEAT_INITIAL_FLAT_MS);
    return () => {
      cancelled = true;
      if (beatTimeout) clearTimeout(beatTimeout);
    };
  }, [running, getElapsedMs, audioStopAtMs]);

  useEffect(() => () => void fadeOutHeartbeatAudioSession(), []);

  const showEcg = stage === 3;
  const subtitle =
    stage === 3
      ? "Parece que alguém está chegando..."
      : stage === 4
        ? "Acho que é você."
        : null;

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background">
      <div className="absolute inset-0 bg-glow" />
      {flash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.45 }}
          className="pointer-events-none absolute inset-0 z-40 bg-white"
        />
      )}

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {stage <= 4 && (
            <motion.div
              key="heart-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-sm flex-col items-center justify-center"
            >
              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center"
                style={{
                  transform: `scale(${stage === 1 ? 1.08 : heartScale})`,
                  transition: "transform 0.14s ease-out",
                }}
              >
                <motion.div
                  animate={stage === 1 ? { scale: [1, 1.1, 1] } : undefined}
                  transition={
                    stage === 1
                      ? { duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                      : undefined
                  }
                >
                  <Heart className="h-14 w-14 fill-accent text-accent drop-shadow-[0_0_32px_rgba(236,72,153,0.55)]" />
                </motion.div>
                {stage >= 2 && (
                  <motion.span
                    key={rippleKey}
                    className="absolute inset-0 rounded-full border border-accent/40"
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.7 }}
                  />
                )}
              </div>

              <div className="mt-10 flex min-h-[5.5rem] w-full items-center justify-center text-center">
                {stage === 2 && (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={BEAT_LINES[beatLine].key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.6 }}
                      className={BEAT_LINES[beatLine].className}
                    >
                      {BEAT_LINES[beatLine].text}
                    </motion.p>
                  </AnimatePresence>
                )}
                {subtitle && (
                  <motion.p
                    key={subtitle}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="font-letter text-lg italic text-muted-foreground sm:text-xl"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>

              {showEcg && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="mt-8 flex w-full justify-center"
                >
                  <EcgContinuousLine
                    elapsedMs={elapsedMs}
                    beatKey={beatKey}
                    running={running}
                    totalMs={CINEMATIC_HEART_MS}
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {stage === 5 && (
            <motion.div
              key="preparing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm text-center"
            >
              <h1 className="font-display text-3xl sm:text-4xl">
                <span className="romantic-gradient-text">Preparando nossa história...</span>
              </h1>
              <p className="mt-5 font-letter text-lg italic leading-relaxed text-muted-foreground">
                Algo especial está sendo guardado só para você.
              </p>
            </motion.div>
          )}

          {stage === 6 && (
            <motion.div
              key="phrases"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-sm text-center"
            >
              <EmotionalProgress phraseIdx={phraseIdx} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

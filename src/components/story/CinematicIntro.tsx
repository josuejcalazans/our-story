import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import EcgContinuousLine from "@/components/EcgContinuousLine";
import { useHeartbeatSound } from "@/hooks/use-heartbeat-sound";
import { unlockHeartbeatAudio } from "@/lib/heartbeat-audio-session";
import {
  CINEMATIC_HEART_MS,
  getCinematicHeartbeatBpm,
  getCinematicHeartbeatCycleMs,
  getHeartGlowIntensity,
  getHeartPulseScale,
  getHeartbeatAudioStopAtMs,
  HEARTBEAT_INITIAL_FLAT_MS,
  STORY_LOADER_MIN_MS,
} from "@/lib/heartbeat-loader-timing";
import { fadeOutHeartbeatAudioSession } from "@/lib/heartbeat-audio-session";

export { STORY_LOADER_MIN_MS };

const STAGE_1_MS = 2000;
const STAGE_2_MS = 3000;
const STAGE_3_MS = 3000;
const STAGE_4_MS = 4000;
const STAGE_5_MS = 2800;
const STAGE_6_MS = 10000;
const FINALE_MS = 2000;

const EMOTIONAL_PHRASES = [
  "Lembrando nosso primeiro encontro...",
  "Revisitando nossas viagens...",
  "Organizando nossas fotos...",
  "Guardando tudo para sempre...",
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

function HeartExplosion({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, id) => ({
        id,
        angle: (id / 40) * 360 + (id % 7) * 8,
        distance: 100 + (id % 6) * 55,
        size: 6 + (id % 5) * 3,
        delay: (id % 8) * 0.025,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                scale: [0, 1.3, 0.7],
                opacity: [0, 1, 0],
                rotate: [0, p.angle * 0.4],
              }}
              transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
            >
              <Heart
                className="fill-accent text-accent"
                style={{ width: p.size, height: p.size }}
                aria-hidden
              />
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          >
            <Heart className="h-16 w-16 fill-accent text-accent drop-shadow-[0_0_40px_rgba(236,72,153,0.8)]" aria-hidden />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>(1);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [finale, setFinale] = useState(false);
  const [darkness, setDarkness] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(55);

  const heartActive = stage >= 2 && stage <= 4 && !finale;
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

  const glowIntensity = getHeartGlowIntensity(currentBpm);

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
    const durations: Record<Stage, number> = {
      1: STAGE_1_MS,
      2: STAGE_2_MS,
      3: STAGE_3_MS,
      4: STAGE_4_MS,
      5: STAGE_5_MS,
      6: STAGE_6_MS,
    };

    if (stage === 4 || finale) return;

    const t = setTimeout(() => {
      if (stage < 6) setStage((stage + 1) as Stage);
    }, durations[stage]);

    return () => clearTimeout(t);
  }, [stage, finale]);

  useEffect(() => {
    if (stage !== 4 || fadingRef.current || finale) return;
    if (elapsedMs < audioStopAtMs) return;

    fadingRef.current = true;
    setFinale(true);

    void fadeOut().then(() => {
      setDarkness(0.92);
      setTimeout(() => {
        setStage(5);
        setTimeout(() => setDarkness(0), 600);
      }, FINALE_MS);
    });
  }, [stage, elapsedMs, audioStopAtMs, fadeOut, finale]);

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

      const bpm = getCinematicHeartbeatBpm(elapsed);
      const cycleMs = getCinematicHeartbeatCycleMs(elapsed);
      setCurrentBpm(bpm);
      setBeatKey((k) => k + 1);
      setRippleKey((k) => k + 1);
      setHeartScale(getHeartPulseScale(bpm));
      setTimeout(() => setHeartScale(1), 100);

      if (!cancelled && elapsed < audioStopAtMs) playBeatRef.current(bpm, true);
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

  const showEcg = stage >= 3 && stage <= 4 && !finale;
  const subtitle =
    stage === 2
      ? "Algo está batendo mais forte..."
      : stage === 3
        ? "Parece que alguém está chegando..."
        : stage === 4
          ? "Acho que é você."
          : null;

  const showHeartBlock = stage <= 4 && !finale;

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background">
      <div className="absolute inset-0 bg-glow" />

      <motion.div
        className="pointer-events-none absolute inset-0 z-20 bg-[#070014]"
        animate={{ opacity: darkness }}
        transition={{ duration: finale ? 0.9 : 0.6, ease: "easeInOut" }}
      />

      <HeartExplosion active={finale} />

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {showHeartBlock && (
            <motion.div
              key="heart-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
              transition={{ duration: 0.5 }}
              className="flex w-full max-w-sm flex-col items-center justify-center"
            >
              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center"
                style={{
                  transform: `scale(${stage === 1 ? 1.06 : heartScale})`,
                  transition: "transform 0.14s ease-out",
                }}
              >
                <motion.div
                  animate={stage === 1 ? { scale: [1, 1.08, 1] } : undefined}
                  transition={
                    stage === 1
                      ? { duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                      : undefined
                  }
                >
                  <Heart
                    className="h-14 w-14 fill-accent text-accent transition-[filter] duration-300"
                    style={{
                      filter: `drop-shadow(0 0 ${20 + glowIntensity * 40}px rgba(236,72,153,${0.45 + glowIntensity * 0.5}))`,
                    }}
                  />
                </motion.div>
                {stage >= 2 && (
                  <motion.span
                    key={rippleKey}
                    className="absolute inset-0 rounded-full border border-accent/40"
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.75 }}
                  />
                )}
              </div>

              {subtitle && (
                <motion.p
                  key={subtitle}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mt-10 font-letter text-center text-lg italic text-muted-foreground sm:text-xl"
                >
                  {subtitle}
                </motion.p>
              )}

              {showEcg && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9 }}
                  className="mt-8 flex w-full justify-center"
                >
                  <EcgContinuousLine
                    elapsedMs={elapsedMs}
                    beatKey={beatKey}
                    running={running}
                    totalMs={CINEMATIC_HEART_MS}
                    bpm={currentBpm}
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {stage === 5 && (
            <motion.div
              key="preparing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
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
              transition={{ duration: 0.8 }}
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

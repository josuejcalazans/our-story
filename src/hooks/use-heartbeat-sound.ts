import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioContext, scheduleLoaderHeartbeat } from "@/lib/heartbeat-sound";

export function useHeartbeatSound(getElapsedMs: () => number, enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const scheduledRef = useRef(false);
  const getElapsedRef = useRef(getElapsedMs);
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  getElapsedRef.current = getElapsedMs;

  const ensureContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const ctx = createAudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.72;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
      scheduledRef.current = false;
    }
    const master = masterRef.current;
    if (!master) throw new Error("Audio master não inicializado");
    return { ctx: ctxRef.current, master };
  }, []);

  const stopAll = useCallback(() => {
    scheduledRef.current = false;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      void ctxRef.current.close();
    }
    ctxRef.current = null;
    masterRef.current = null;
    setUnlocked(false);
  }, []);

  /** Deve rodar sincronamente no gesto do usuário (touch/click) — exigido no iOS. */
  const unlockFromGesture = useCallback(() => {
    if (!enabled || muted || typeof window === "undefined") return;

    try {
      const { ctx, master } = ensureContext();

      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      // Buffer silencioso — ajuda a desbloquear áudio no Safari iOS
      const buffer = ctx.createBuffer(1, 1, 22050);
      const ping = ctx.createBufferSource();
      ping.buffer = buffer;
      ping.connect(ctx.destination);
      ping.start(0);

      master.gain.value = 0.72;
      setUnlocked(true);

      if (!scheduledRef.current) {
        scheduleLoaderHeartbeat(ctx, master, () => getElapsedRef.current());
        scheduledRef.current = true;
      }
    } catch {
      /* Web Audio indisponível */
    }
  }, [enabled, muted, ensureContext]);

  const mute = useCallback(() => {
    setMuted(true);
    if (masterRef.current) masterRef.current.gain.value = 0;
  }, []);

  const unmuteFromGesture = useCallback(() => {
    setMuted(false);
    scheduledRef.current = false;
    unlockFromGesture();
  }, [unlockFromGesture]);

  useEffect(() => {
    if (!enabled) {
      stopAll();
      return;
    }
    return () => stopAll();
  }, [enabled, stopAll]);

  return {
    muted,
    unlocked,
    needsTap: enabled && !unlocked && !muted,
    mute,
    unmuteFromGesture,
    unlockFromGesture,
  };
}

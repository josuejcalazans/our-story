import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioContext, playHeartbeatBeat } from "@/lib/heartbeat-sound";

export function useHeartbeatSound(enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const unlockedRef = useRef(false);
  const mutedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  mutedRef.current = muted;
  unlockedRef.current = unlocked;

  const ensureContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const ctx = createAudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.58;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    const master = masterRef.current;
    if (!master) throw new Error("Audio master não inicializado");
    return { ctx: ctxRef.current, master };
  }, []);

  const stopAll = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      void ctxRef.current.close();
    }
    ctxRef.current = null;
    masterRef.current = null;
    unlockedRef.current = false;
    setUnlocked(false);
  }, []);

  /** Deve rodar sincronamente no gesto do usuário (touch/click) — exigido no iOS. */
  const unlockFromGesture = useCallback(async () => {
    if (!enabled || mutedRef.current || typeof window === "undefined") return;

    try {
      const { ctx, master } = ensureContext();

      if (ctx.state !== "running") {
        await ctx.resume();
      }

      const buffer = ctx.createBuffer(1, 1, 22050);
      const ping = ctx.createBufferSource();
      ping.buffer = buffer;
      ping.connect(ctx.destination);
      ping.start();

      master.gain.value = 0.58;
      unlockedRef.current = true;
      setUnlocked(true);
    } catch {
      /* Web Audio indisponível */
    }
  }, [enabled, ensureContext]);

  const playBeat = useCallback(
    (bpm: number) => {
      if (!enabled || mutedRef.current || !unlockedRef.current) return;
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (!ctx || !master) return;
      playHeartbeatBeat(ctx, master, bpm);
    },
    [enabled],
  );

  const mute = useCallback(() => {
    setMuted(true);
    mutedRef.current = true;
    if (masterRef.current) masterRef.current.gain.value = 0;
  }, []);

  const unmuteFromGesture = useCallback(() => {
    setMuted(false);
    mutedRef.current = false;
    void unlockFromGesture();
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
    playBeat,
  };
}

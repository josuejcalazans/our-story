import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAudioContext,
  HEARTBEAT_CYCLE_MS,
  playHeartbeatPulse,
  startHeartbeatLoop,
} from "@/lib/heartbeat-sound";

export function useHeartbeatSound(enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const ctx = createAudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.72;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    return { ctx: ctxRef.current, master: masterRef.current! };
  }, []);

  const stopLoop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    stopLoop();
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      void ctxRef.current.close();
    }
    ctxRef.current = null;
    masterRef.current = null;
    setUnlocked(false);
  }, [stopLoop]);

  /** Chamar direto de click / pointerdown. */
  const unlockFromGesture = useCallback(() => {
    if (!enabled || muted || typeof window === "undefined") return;

    try {
      const { ctx, master } = ensureContext();

      void ctx.resume().then(() => {
        if (ctx.state !== "running") return;
        master.gain.value = 0.72;
        setUnlocked(true);
        if (!stopRef.current) {
          stopRef.current = startHeartbeatLoop(ctx, master);
        }
        playHeartbeatPulse(ctx, master);
      });
    } catch {
      /* Web Audio indisponível */
    }
  }, [enabled, muted, ensureContext]);

  const mute = useCallback(() => {
    setMuted(true);
    if (masterRef.current) masterRef.current.gain.value = 0;
    stopLoop();
  }, [stopLoop]);

  const unmuteFromGesture = useCallback(() => {
    setMuted(false);
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
    cycleMs: HEARTBEAT_CYCLE_MS,
  };
}

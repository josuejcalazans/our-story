import { useCallback, useEffect, useRef, useState } from "react";
import { HEARTBEAT_CYCLE_MS, startHeartbeatLoop } from "@/lib/heartbeat-sound";

export function useHeartbeatSound(enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [muted, setMuted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const prefersQuiet =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!enabled || muted || prefersQuiet || typeof window === "undefined") return;

    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const stopLoop = await startHeartbeatLoop(ctx);
    if (!stopLoop) {
      setNeedsTap(true);
      void ctx.close();
      ctxRef.current = null;
      return;
    }

    setNeedsTap(false);
    stopRef.current = stopLoop;
  }, [enabled, muted, prefersQuiet, stop]);

  const enableSound = useCallback(async () => {
    setMuted(false);
    setNeedsTap(false);
    await start();
  }, [start]);

  useEffect(() => {
    if (!enabled || muted || prefersQuiet) {
      stop();
      return;
    }

    void start();

    return stop;
  }, [enabled, muted, prefersQuiet, start, stop]);

  return {
    muted,
    needsTap: needsTap && !muted && !prefersQuiet,
    toggleMute: () => setMuted((m) => !m),
    enableSound,
    cycleMs: HEARTBEAT_CYCLE_MS,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getHeartbeatSession,
  isHeartbeatAudioStopped,
  isHeartbeatAudioUnlocked,
  setHeartbeatMuted,
  stopHeartbeatAudioSession,
  unlockHeartbeatAudio,
} from "@/lib/heartbeat-audio-session";
import { playHeartbeatBeat } from "@/lib/heartbeat-sound";

export function useHeartbeatSound(enabled = true) {
  const enabledRef = useRef(enabled);
  const [muted, setMuted] = useState(false);

  enabledRef.current = enabled;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const stopAll = useCallback(() => {
    stopHeartbeatAudioSession();
    setMuted(false);
  }, []);

  const playBeat = useCallback((bpm: number) => {
    if (
      !enabledRef.current ||
      mutedRef.current ||
      !isHeartbeatAudioUnlocked() ||
      isHeartbeatAudioStopped()
    ) {
      return;
    }

    const session = getHeartbeatSession();
    if (!session || session.ctx.state !== "running") return;
    playHeartbeatBeat(session.ctx, session.master, bpm);
  }, []);

  const mute = useCallback(() => {
    setMuted(true);
    setHeartbeatMuted(true);
  }, []);

  const unmute = useCallback(() => {
    setMuted(false);
    setHeartbeatMuted(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopAll();
      return;
    }
    return () => stopAll();
  }, [enabled, stopAll]);

  return {
    muted,
    mute,
    unmute,
    playBeat,
    stopAll,
    unlockFromGesture: unlockHeartbeatAudio,
  };
}

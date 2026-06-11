import { useCallback, useRef, useState } from "react";
import {
  getHeartbeatSession,
  isHeartbeatAudioStopped,
  isHeartbeatAudioUnlocked,
  setHeartbeatMuted,
  stopHeartbeatAudioSession,
  unlockHeartbeatAudio,
} from "@/lib/heartbeat-audio-session";
import { playHeartbeatBeat } from "@/lib/heartbeat-sound";

export function useHeartbeatSound() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const stopAll = useCallback(() => {
    stopHeartbeatAudioSession();
    setMuted(false);
  }, []);

  const playBeat = useCallback((bpm: number) => {
    if (mutedRef.current || !isHeartbeatAudioUnlocked() || isHeartbeatAudioStopped()) {
      return;
    }

    const current = getHeartbeatSession();
    if (!current || current.ctx.state === "closed") return;

    if (current.ctx.state === "suspended") {
      void current.ctx.resume().then((ok) => {
        if (!ok || isHeartbeatAudioStopped()) return;
        playHeartbeatBeat(current.ctx, current.master, bpm);
      });
      return;
    }

    playHeartbeatBeat(current.ctx, current.master, bpm);
  }, []);

  const mute = useCallback(() => {
    setMuted(true);
    setHeartbeatMuted(true);
  }, []);

  const unmute = useCallback(() => {
    setMuted(false);
    setHeartbeatMuted(false);
  }, []);

  return {
    muted,
    mute,
    unmute,
    playBeat,
    stopAll,
    unlockFromGesture: unlockHeartbeatAudio,
  };
}

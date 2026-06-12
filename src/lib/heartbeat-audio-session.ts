import {
  resetPlaybackAudioSession,
  setPlaybackAudioSession,
} from "@/lib/heartbeat-audio-unlock";
import { createAudioContext, createHeartbeatBus, createBreathingLayer } from "@/lib/heartbeat-sound";
import { loadHeartbeatSample } from "@/lib/heartbeat-sample";

type Session = {
  ctx: AudioContext;
  master: GainNode;
  compressor: DynamicsCompressorNode;
  stopBreathing: () => void;
};

let session: Session | null = null;
let stopped = true;
let unlocked = false;
let fading = false;

export function isHeartbeatAudioStopped() {
  return stopped;
}

export function isHeartbeatAudioUnlocked() {
  return unlocked && !stopped;
}

export function getHeartbeatSession(): Omit<Session, "stopBreathing"> | null {
  if (stopped || !session || session.ctx.state === "closed") return null;
  return session;
}

function ensureSession(): Session {
  stopped = false;
  fading = false;
  if (session && session.ctx.state !== "closed") return session;

  const ctx = createAudioContext();
  const { master, compressor } = createHeartbeatBus(ctx);
  const stopBreathing = createBreathingLayer(ctx, master);
  session = { ctx, master, compressor, stopBreathing };
  return session;
}

function closeSession(s: Session) {
  try {
    s.stopBreathing();
    const t = s.ctx.currentTime;
    s.master.gain.cancelScheduledValues(t);
    s.master.gain.setValueAtTime(0, t);
    s.master.disconnect();
    s.compressor.disconnect();
  } catch {
    /* nó já desconectado */
  }

  if (s.ctx.state === "running") void s.ctx.suspend();
  void s.ctx.close();
}

export async function unlockHeartbeatAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (unlocked && session && session.ctx.state === "running") return true;

  try {
    setPlaybackAudioSession();
    stopped = false;
    fading = false;

    const { ctx, master } = ensureSession();

    if (ctx.state === "suspended") await ctx.resume();
    if (stopped || ctx.state !== "running") return false;

    void loadHeartbeatSample(ctx);

    const t = ctx.currentTime;
    const ping = ctx.createBufferSource();
    ping.buffer = ctx.createBuffer(1, 1, 22050);
    ping.connect(master);
    ping.start(t);
    ping.stop(t + 0.01);

    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0.5, t);

    unlocked = true;
    return true;
  } catch {
    return false;
  }
}

export function setHeartbeatMuted(muted: boolean) {
  const current = getHeartbeatSession();
  if (!current || fading) return;
  const t = current.ctx.currentTime;
  current.master.gain.cancelScheduledValues(t);
  current.master.gain.setValueAtTime(muted ? 0 : 0.5, t);
}

export function fadeOutHeartbeatAudioSession(fadeMs = 700): Promise<void> {
  if (fading) {
    return new Promise((resolve) => {
      const check = () => {
        if (!fading) resolve();
        else window.setTimeout(check, 40);
      };
      check();
    });
  }

  stopped = true;
  unlocked = false;

  const current = session;
  if (!current || current.ctx.state === "closed") {
    session = null;
    resetPlaybackAudioSession();
    return Promise.resolve();
  }

  fading = true;
  const fadeSec = fadeMs / 1000;

  try {
    const t = current.ctx.currentTime;
    const currentGain = current.master.gain.value;
    current.master.gain.cancelScheduledValues(t);
    current.master.gain.setValueAtTime(currentGain, t);
    current.master.gain.linearRampToValueAtTime(0, t + fadeSec);
  } catch {
    fading = false;
    session = null;
    closeSession(current);
    resetPlaybackAudioSession();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      fading = false;
      const s = session;
      session = null;
      resetPlaybackAudioSession();
      if (s) closeSession(s);
      resolve();
    }, fadeMs + 60);
  });
}

export function stopHeartbeatAudioSession() {
  stopped = true;
  unlocked = false;
  fading = false;
  resetPlaybackAudioSession();

  const current = session;
  session = null;
  if (!current || current.ctx.state === "closed") return;
  closeSession(current);
}

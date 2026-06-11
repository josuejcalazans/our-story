import {
  resetPlaybackAudioSession,
  setPlaybackAudioSession,
} from "@/lib/heartbeat-audio-unlock";
import { createAudioContext, createHeartbeatBus } from "@/lib/heartbeat-sound";

type Session = {
  ctx: AudioContext;
  master: GainNode;
  compressor: DynamicsCompressorNode;
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

export function getHeartbeatSession(): Session | null {
  if (stopped || !session || session.ctx.state === "closed") return null;
  return session;
}

function ensureSession(): Session {
  stopped = false;
  fading = false;
  if (session && session.ctx.state !== "closed") return session;

  const ctx = createAudioContext();
  const { master, compressor } = createHeartbeatBus(ctx);
  session = { ctx, master, compressor };
  return session;
}

function closeSession(ctx: AudioContext, master: GainNode, compressor: DynamicsCompressorNode) {
  try {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0, t);
    master.disconnect();
    compressor.disconnect();
  } catch {
    /* nó já desconectado */
  }

  if (ctx.state === "running") {
    void ctx.suspend();
  }
  void ctx.close();
}

/** No toque da tela Preparando — await resume para iOS */
export async function unlockHeartbeatAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (unlocked && session && session.ctx.state === "running") return true;

  try {
    setPlaybackAudioSession();
    stopped = false;
    fading = false;

    const { ctx, master } = ensureSession();

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (stopped || ctx.state !== "running") return false;

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

/** Fade suave — usado no final do loader */
export function fadeOutHeartbeatAudioSession(fadeMs = 550): Promise<void> {
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
  const { ctx, master, compressor } = current;
  const fadeSec = fadeMs / 1000;

  try {
    const t = ctx.currentTime;
    const currentGain = master.gain.value;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(currentGain, t);
    master.gain.linearRampToValueAtTime(0, t + fadeSec);
  } catch {
    fading = false;
    session = null;
    closeSession(ctx, master, compressor);
    resetPlaybackAudioSession();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      fading = false;
      session = null;
      resetPlaybackAudioSession();
      closeSession(ctx, master, compressor);
      resolve();
    }, fadeMs + 60);
  });
}

/** Para imediato — só quando já está silenciado ou navegação forçada */
export function stopHeartbeatAudioSession() {
  stopped = true;
  unlocked = false;
  fading = false;
  resetPlaybackAudioSession();

  const current = session;
  session = null;

  if (!current || current.ctx.state === "closed") return;
  closeSession(current.ctx, current.master, current.compressor);
}

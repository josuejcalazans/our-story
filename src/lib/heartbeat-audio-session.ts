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
  if (session && session.ctx.state !== "closed") return session;

  const ctx = createAudioContext();
  const { master, compressor } = createHeartbeatBus(ctx);
  session = { ctx, master, compressor };
  return session;
}

/** No toque da tela Preparando — await resume para iOS */
export async function unlockHeartbeatAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (unlocked && session && session.ctx.state === "running") return true;

  try {
    setPlaybackAudioSession();
    stopped = false;

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
  if (!current) return;
  const t = current.ctx.currentTime;
  current.master.gain.cancelScheduledValues(t);
  current.master.gain.setValueAtTime(muted ? 0 : 0.5, t);
}

/** Para ao terminar o loader — não chamar no remount do React */
export function stopHeartbeatAudioSession() {
  stopped = true;
  unlocked = false;
  resetPlaybackAudioSession();

  const current = session;
  session = null;

  if (!current || current.ctx.state === "closed") return;

  const { ctx, master, compressor } = current;

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

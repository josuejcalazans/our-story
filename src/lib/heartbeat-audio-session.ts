import {
  primeSilentAudio,
  setPlaybackAudioSession,
  stopSilentAudio,
} from "@/lib/heartbeat-audio-unlock";
import { createAudioContext, createHeartbeatBus } from "@/lib/heartbeat-sound";

type Session = {
  ctx: AudioContext;
  master: GainNode;
};

let session: Session | null = null;
let stopped = true;
let unlocked = false;
let unlocking = false;

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
  const { master } = createHeartbeatBus(ctx);
  session = { ctx, master };
  return session;
}

/** Chamado no toque da tela "Preparando" — gesto do usuário (iOS) */
export async function unlockHeartbeatAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (unlocked && session && session.ctx.state === "running") return true;
  if (unlocking) return unlocked;
  unlocking = true;

  try {
    setPlaybackAudioSession();
    await primeSilentAudio();
    stopSilentAudio();

    if (stopped) stopped = false;

    const { ctx, master } = ensureSession();

    if (ctx.state !== "running") {
      await ctx.resume();
    }

    if (stopped) return false;

    const buffer = ctx.createBuffer(1, 1, 22050);
    const ping = ctx.createBufferSource();
    ping.buffer = buffer;
    ping.connect(master);
    ping.start(0);
    ping.stop(ctx.currentTime + 0.01);

    master.gain.value = 0.5;

    if (ctx.state === "running") {
      unlocked = true;
      return true;
    }
  } catch {
    /* Web Audio indisponível */
  } finally {
    unlocking = false;
  }

  return false;
}

export function setHeartbeatMuted(muted: boolean) {
  const current = getHeartbeatSession();
  if (!current) return;
  current.master.gain.value = muted ? 0 : 0.5;
}

/** Para imediatamente — ao sair do loader */
export function stopHeartbeatAudioSession() {
  stopped = true;
  unlocked = false;
  unlocking = false;
  stopSilentAudio();

  const current = session;
  session = null;

  if (!current || current.ctx.state === "closed") return;

  try {
    current.master.gain.cancelScheduledValues(current.ctx.currentTime);
    current.master.gain.setValueAtTime(0, current.ctx.currentTime);
  } catch {
    /* já fechado */
  }

  void current.ctx.close();
}

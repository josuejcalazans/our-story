import { pulseHeartbeatHaptic } from "@/lib/heartbeat-haptics";
import { LUB_DUB_GAP_MS } from "@/lib/heartbeat-loader-timing";
import { playHeartbeatSampleLayer } from "@/lib/heartbeat-sample";

export {
  STORY_LOADER_MIN_MS,
  HEARTBEAT_ACCELERATE_AT_MS,
  HEARTBEAT_CYCLE_SLOW_MS,
  getHeartbeatCycleMs,
  cycleMsToBpm,
} from "@/lib/heartbeat-loader-timing";

export function createAudioContext(): AudioContext {
  const Win = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = Win.AudioContext ?? Win.webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio não suportado");
  return new Ctor();
}

export function createHeartbeatBus(ctx: AudioContext) {
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();

  master.gain.value = 0.5;
  compressor.threshold.setValueAtTime(-22, 0);
  compressor.knee.setValueAtTime(12, 0);
  compressor.ratio.setValueAtTime(5, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.18, 0);

  master.connect(compressor);
  compressor.connect(ctx.destination);

  return { master, compressor };
}

type BeatOpts = { cinematic?: boolean };

function thump(
  ctx: AudioContext,
  master: GainNode,
  st: number,
  hz: number,
  vol: number,
  dur: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(hz < 55 ? 175 : 210, st);
  filter.Q.setValueAtTime(0.7, st);

  osc.type = "sine";
  osc.frequency.setValueAtTime(hz, st);
  osc.frequency.exponentialRampToValueAtTime(Math.max(28, hz * 0.5), st + dur);

  gain.gain.setValueAtTime(0, st);
  gain.gain.linearRampToValueAtTime(vol, st + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, st + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(st);
  osc.stop(st + dur + 0.02);
}

/** Lub-dub cinematográfico: grave encorpado + dub suave */
export function playCinematicHeartbeatBeat(ctx: AudioContext, master: GainNode, bpm: number) {
  try {
    if (ctx.state === "closed") return;
    if (ctx.state === "suspended") void ctx.resume();

    const t = ctx.currentTime;
    const dubAt = t + LUB_DUB_GAP_MS / 1000;

    // LUB — forte, encorpado (62 Hz + corpo em 40 Hz)
    thump(ctx, master, t, 62, 0.32, 0.13);
    thump(ctx, master, t, 40, 0.11, 0.11);

    // DUB — mais suave e curto (48 Hz)
    thump(ctx, master, dubAt, 48, 0.14, 0.075);

    playHeartbeatSampleLayer(ctx, master, bpm, t);
    pulseHeartbeatHaptic("lub");
  } catch {
    /* Web Audio indisponível */
  }
}

/** Loader simples — mantém aceleração progressiva */
export function playHeartbeatBeat(
  ctx: AudioContext,
  master: GainNode,
  bpm: number,
  opts: BeatOpts = {},
) {
  if (opts.cinematic || bpm <= 120) {
    playCinematicHeartbeatBeat(ctx, master, bpm);
    return;
  }

  try {
    if (ctx.state === "closed") return;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const dubAt = t + LUB_DUB_GAP_MS / 1000;
    const vol = Math.min(0.28, 0.18 + bpm / 1200);

    thump(ctx, master, t, 62, vol, 0.11);
    thump(ctx, master, dubAt, 48, vol * 0.45, 0.07);
  } catch {
    /* Web Audio indisponível */
  }
}

/** Respiração suave (~5% vol) — sensação de vida */
export function createBreathingLayer(ctx: AudioContext, master: GainNode) {
  const seconds = 4;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.018 * white) / 1.018;
    const breath = Math.sin((i / ctx.sampleRate) * Math.PI * 0.45);
    data[i] = last * 0.6 * (0.35 + 0.65 * Math.max(0, breath));
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 280;
  filter.Q.value = 0.4;

  const gain = ctx.createGain();
  gain.gain.value = 0.05;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();

  return () => {
    try {
      src.stop();
    } catch {
      /* já parado */
    }
  };
}

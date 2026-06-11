import {
  getHeartbeatCycleMs,
  getLubDubOffsetsSec,
} from "@/lib/heartbeat-loader-timing";

export {
  STORY_LOADER_MIN_MS,
  HEARTBEAT_ACCELERATE_AT_MS,
  HEARTBEAT_CYCLE_SLOW_MS,
  getHeartbeatCycleMs,
} from "@/lib/heartbeat-loader-timing";

export function createAudioContext(): AudioContext {
  const Win = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = Win.AudioContext ?? Win.webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio não suportado");
  return new Ctor();
}

/** Um "tum" grave — queda de pitch + leve harmônico para corpo, sem ruído metálico */
function thump(
  ctx: AudioContext,
  master: GainNode,
  time: number,
  baseHz: number,
  peakGain: number,
  decaySec: number,
) {
  const osc = ctx.createOscillator();
  const body = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const out = ctx.createGain();

  const harm = ctx.createOscillator();
  const harmGain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(baseHz, time);
  osc.frequency.exponentialRampToValueAtTime(Math.max(24, baseHz * 0.42), time + decaySec * 0.65);

  harm.type = "sine";
  harm.frequency.setValueAtTime(baseHz * 1.85, time);
  harm.frequency.exponentialRampToValueAtTime(Math.max(28, baseHz * 0.9), time + decaySec * 0.35);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(180, time);
  filter.frequency.exponentialRampToValueAtTime(70, time + decaySec);
  filter.Q.setValueAtTime(0.5, time);

  body.gain.setValueAtTime(0, time);
  body.gain.linearRampToValueAtTime(peakGain, time + 0.004);
  body.gain.exponentialRampToValueAtTime(0.0001, time + decaySec);

  harmGain.gain.setValueAtTime(0, time);
  harmGain.gain.linearRampToValueAtTime(peakGain * 0.22, time + 0.003);
  harmGain.gain.exponentialRampToValueAtTime(0.0001, time + decaySec * 0.45);

  osc.connect(filter);
  filter.connect(body);
  body.connect(out);

  harm.connect(harmGain);
  harmGain.connect(out);
  out.connect(master);

  osc.start(time);
  osc.stop(time + decaySec + 0.06);
  harm.start(time);
  harm.stop(time + decaySec * 0.5 + 0.04);
}

function lubDubAt(
  ctx: AudioContext,
  master: GainNode,
  cycleStart: number,
  cycleMs: number,
  intensity = 1,
) {
  const { lubAtSec, dubAtSec } = getLubDubOffsetsSec(cycleMs);
  thump(ctx, master, cycleStart + lubAtSec, 62, 0.32 * intensity, 0.2);
  thump(ctx, master, cycleStart + dubAtSec, 48, 0.14 * intensity, 0.16);
}

export function startHeartbeatLoop(
  ctx: AudioContext,
  master: GainNode,
  getElapsedMs: () => number,
) {
  let nextCycleStart = ctx.currentTime;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const elapsedAtAudioTime = (audioTime: number) => {
    const deltaSec = audioTime - ctx.currentTime;
    return getElapsedMs() + deltaSec * 1000;
  };

  const schedule = () => {
    if (ctx.state === "closed") return;

    while (nextCycleStart < ctx.currentTime + 3) {
      const cycleMs = getHeartbeatCycleMs(Math.max(0, elapsedAtAudioTime(nextCycleStart)));
      lubDubAt(ctx, master, nextCycleStart, cycleMs);
      nextCycleStart += cycleMs / 1000;
    }

    timerId = window.setTimeout(schedule, 100);
  };

  schedule();

  return () => {
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}

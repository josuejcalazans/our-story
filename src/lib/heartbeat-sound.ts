import {
  buildBeatSchedule,
  getLubDubOffsetsSec,
  HEARTBEAT_ACCELERATE_AT_MS,
} from "@/lib/heartbeat-loader-timing";

export {
  STORY_LOADER_MIN_MS,
  HEARTBEAT_ACCELERATE_AT_MS,
  HEARTBEAT_CYCLE_SLOW_MS,
  getHeartbeatCycleMs,
  buildBeatSchedule,
} from "@/lib/heartbeat-loader-timing";

export function createAudioContext(): AudioContext {
  const Win = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = Win.AudioContext ?? Win.webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio não suportado");
  return new Ctor();
}

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

/** Agenda todos os batimentos do loader de uma vez — sem loop */
export function scheduleLoaderHeartbeat(
  ctx: AudioContext,
  master: GainNode,
  getElapsedMs: () => number,
) {
  const schedule = buildBeatSchedule();
  const timers: ReturnType<typeof setTimeout>[] = [];
  const elapsed = getElapsedMs();

  for (const pulse of schedule) {
    const delayMs = pulse.atMs - elapsed;
    if (delayMs < -80) continue;

    const fast = pulse.atMs >= HEARTBEAT_ACCELERATE_AT_MS;
    const spec =
      pulse.kind === "lub"
        ? { hz: 62, gain: fast ? 0.28 : 0.32, decay: fast ? 0.09 : 0.2 }
        : { hz: 48, gain: fast ? 0.12 : 0.14, decay: fast ? 0.07 : 0.16 };

    const id = window.setTimeout(
      () => {
        if (ctx.state !== "running") return;
        thump(ctx, master, ctx.currentTime + 0.008, spec.hz, spec.gain, spec.decay);
      },
      Math.max(0, delayMs),
    );
    timers.push(id);
  }

  return () => timers.forEach((id) => window.clearTimeout(id));
}

export { getLubDubOffsetsSec };

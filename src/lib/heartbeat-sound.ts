/** Duração de um ciclo visual do coração (ms) — manter em sync com StoryHeartbeatLoader */
export const HEARTBEAT_CYCLE_MS = 2400;

/** Picos da animação do coração (times em StoryHeartbeatLoader) */
const LUB_AT_CYCLE = 0.12;
const DUB_AT_CYCLE = 0.34;

const CYCLE_SEC = HEARTBEAT_CYCLE_MS / 1000;
const LUB_AT_SEC = LUB_AT_CYCLE * CYCLE_SEC;
const DUB_AT_SEC = DUB_AT_CYCLE * CYCLE_SEC;

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
  intensity = 1,
) {
  thump(ctx, master, cycleStart + LUB_AT_SEC, 62, 0.32 * intensity, 0.2);
  thump(ctx, master, cycleStart + DUB_AT_SEC, 48, 0.14 * intensity, 0.16);
}

export function playHeartbeatPulse(ctx: AudioContext, master: GainNode, volume = 1) {
  if (ctx.state === "closed") return;
  lubDubAt(ctx, master, ctx.currentTime + 0.01, volume);
}

export function startHeartbeatLoop(ctx: AudioContext, master: GainNode) {
  let nextCycleStart = ctx.currentTime;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if (ctx.state === "closed") return;

    while (nextCycleStart < ctx.currentTime + CYCLE_SEC * 4) {
      lubDubAt(ctx, master, nextCycleStart);
      nextCycleStart += CYCLE_SEC;
    }

    const leadSec = CYCLE_SEC * 2;
    const msUntilReschedule = Math.max(
      80,
      (nextCycleStart - ctx.currentTime - leadSec) * 1000,
    );
    timerId = window.setTimeout(schedule, msUntilReschedule);
  };

  schedule();

  return () => {
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}

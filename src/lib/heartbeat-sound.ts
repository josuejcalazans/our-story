/** Duração de um ciclo visual do coração (ms) — manter em sync com StoryHeartbeatLoader */
export const HEARTBEAT_CYCLE_MS = 2400;

/** Intervalo natural entre "lub" e "dub" (~66 bpm em repouso) */
const LUB_TO_DUB_SEC = 0.105;

export function createAudioContext(): AudioContext {
  const Win = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = Win.AudioContext ?? Win.webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio não suportado");
  return new Ctor();
}

/** Um "tum" grave e abafado — sem ruído metálico */
function thump(
  ctx: AudioContext,
  master: GainNode,
  time: number,
  baseHz: number,
  peakGain: number,
  decaySec: number,
) {
  const osc = ctx.createOscillator();
  const tone = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const out = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(baseHz, time);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, baseHz * 0.52), time + decaySec * 0.55);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(120, time);
  filter.frequency.exponentialRampToValueAtTime(55, time + decaySec);
  filter.Q.setValueAtTime(0.6, time);

  tone.gain.setValueAtTime(0, time);
  tone.gain.linearRampToValueAtTime(peakGain, time + 0.006);
  tone.gain.exponentialRampToValueAtTime(0.0001, time + decaySec);

  osc.connect(filter);
  filter.connect(tone);
  tone.connect(out);
  out.connect(master);

  osc.start(time);
  osc.stop(time + decaySec + 0.05);
}

/** Par lub–dub clássico */
function lubDub(ctx: AudioContext, master: GainNode, time: number, intensity = 1) {
  thump(ctx, master, time, 52, 0.38 * intensity, 0.28);
  thump(ctx, master, time + LUB_TO_DUB_SEC, 44, 0.16 * intensity, 0.22);
}

export function playHeartbeatPulse(ctx: AudioContext, master: GainNode, volume = 1) {
  if (ctx.state === "closed") return;
  const t = ctx.currentTime + 0.01;
  lubDub(ctx, master, t, volume);
}

export function startHeartbeatLoop(ctx: AudioContext, master: GainNode) {
  const tick = () => playHeartbeatPulse(ctx, master);
  tick();
  const interval = window.setInterval(tick, HEARTBEAT_CYCLE_MS);
  return () => window.clearInterval(interval);
}

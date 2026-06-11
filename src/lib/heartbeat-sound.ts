/** Duração de um ciclo visual do coração (ms) — manter em sync com StoryHeartbeatLoader */
export const HEARTBEAT_CYCLE_MS = 2400;

const SECOND_THUMP_DELAY_MS = 130;

function createThump(ctx: AudioContext, time: number, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(72, time);
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.1);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(180, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.22), time + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.16);
}

export function playHeartbeatPulse(ctx: AudioContext, volume = 1) {
  if (ctx.state !== "running") return;
  const now = ctx.currentTime;
  createThump(ctx, now, volume);
  createThump(ctx, now + SECOND_THUMP_DELAY_MS / 1000, volume * 0.62);
}

export async function startHeartbeatLoop(ctx: AudioContext) {
  await ctx.resume();
  if (ctx.state !== "running") return null;

  const tick = () => playHeartbeatPulse(ctx);
  tick();
  const interval = window.setInterval(tick, HEARTBEAT_CYCLE_MS);
  return () => window.clearInterval(interval);
}

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

/**
 * Batimento lub-dub — mesma fórmula do demo que funciona no Safari/iOS.
 * Chamado a cada ciclo via setTimeout (não pré-agendado).
 */
export function playHeartbeatBeat(ctx: AudioContext, master: GainNode, bpm: number) {
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;

    function thump(st: number, freq: number, vol: number, dur: number) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, st + dur);
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(vol, st + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, st + dur);
      osc.start(st);
      osc.stop(st + dur + 0.02);
    }

    const v = Math.min(0.5, 0.3 + bpm / 600);
    thump(t, 55, v * 1.1, 0.12);
    thump(t, 38, v * 0.8, 0.15);
    const d = Math.max(0.05, (60 / bpm) * 0.28);
    thump(t + d, 50, v, 0.1);
    thump(t + d, 35, v * 0.7, 0.12);

    if (bpm > 120) {
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumble.connect(rumbleGain);
      rumbleGain.connect(master);
      rumble.type = "sawtooth";
      rumble.frequency.setValueAtTime(30, t);
      rumble.frequency.linearRampToValueAtTime(24, t + 0.3);
      rumbleGain.gain.setValueAtTime(0.04, t);
      rumbleGain.gain.linearRampToValueAtTime(0, t + 0.3);
      rumble.start(t);
      rumble.stop(t + 0.35);
    }
  } catch {
    /* Web Audio indisponível */
  }
}

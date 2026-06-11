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
 * Batimento lub-dub — chamado a cada ciclo via setTimeout.
 * Volume e decay encurtam quando acelera para não empilhar graves.
 */
export function playHeartbeatBeat(ctx: AudioContext, master: GainNode, bpm: number) {
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const fast = bpm > 110;

    function thump(st: number, freq: number, vol: number, dur: number) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(fast ? 130 : 190, st);
      filter.Q.setValueAtTime(0.6, st);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(28, freq * (fast ? 0.5 : 0.32)),
        st + dur,
      );
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(vol, st + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      osc.start(st);
      osc.stop(st + dur + 0.02);
    }

    // Calmo sobe um pouco; acelerado desce — evita clipping com batimentos sobrepostos
    const v = fast
      ? Math.max(0.12, 0.3 - (bpm - 110) / 850)
      : Math.min(0.34, 0.24 + bpm / 900);

    const lubDecay = fast ? Math.min(0.07, 45 / bpm) : 0.11;
    const dubDecay = fast ? Math.min(0.06, 38 / bpm) : 0.09;
    const dubGap = Math.max(0.035, (60 / bpm) * 0.26);

    thump(t, fast ? 62 : 55, v, lubDecay);
    thump(t, fast ? 50 : 40, v * 0.55, lubDecay + 0.015);
    thump(t + dubGap, fast ? 58 : 50, v * 0.7, dubDecay);
    thump(t + dubGap, fast ? 46 : 36, v * 0.45, dubDecay + 0.01);
  } catch {
    /* Web Audio indisponível */
  }
}

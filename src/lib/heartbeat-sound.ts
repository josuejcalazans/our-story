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

/** Master + compressor para evitar saturação no tutututu final */
export function createHeartbeatBus(ctx: AudioContext) {
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();

  master.gain.value = 0.5;
  compressor.threshold.setValueAtTime(-20, 0);
  compressor.knee.setValueAtTime(10, 0);
  compressor.ratio.setValueAtTime(6, 0);
  compressor.attack.setValueAtTime(0.002, 0);
  compressor.release.setValueAtTime(0.06, 0);

  master.connect(compressor);
  compressor.connect(ctx.destination);

  return { master, compressor };
}

type ThumpOpts = { treble?: boolean };

/**
 * Batimento lub-dub — padrão simplifica conforme acelera
 * para caber dentro do ciclo sem empilhar graves.
 */
export function playHeartbeatBeat(ctx: AudioContext, master: GainNode, bpm: number) {
  try {
    if (ctx.state === "closed") return;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const cycleSec = 60 / bpm;
    const sprint = bpm > 260;
    const rush = bpm > 165;

    function thump(st: number, freq: number, vol: number, dur: number, opts: ThumpOpts = {}) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = opts.treble ? "highpass" : "lowpass";
      filter.frequency.setValueAtTime(opts.treble ? 90 : rush ? 115 : 185, st);
      filter.Q.setValueAtTime(0.5, st);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(opts.treble ? 55 : 30, freq * (sprint ? 0.65 : rush ? 0.52 : 0.32)),
        st + dur,
      );
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(vol, st + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      osc.start(st);
      osc.stop(st + dur + 0.015);
    }

    const v = sprint
      ? Math.max(0.035, 0.1 - (bpm - 260) / 2500)
      : rush
        ? Math.max(0.07, 0.2 - (bpm - 165) / 1100)
        : Math.min(0.32, 0.22 + bpm / 950);

    const maxDur = cycleSec * (sprint ? 0.28 : rush ? 0.38 : 0.52);

    if (sprint) {
      thump(t, 82, v, Math.min(0.028, maxDur), { treble: true });
      return;
    }

    if (rush) {
      const dubGap = Math.min(0.028, cycleSec * 0.2);
      thump(t, 66, v, Math.min(0.038, maxDur));
      thump(t + dubGap, 58, v * 0.55, Math.min(0.032, maxDur));
      return;
    }

    const lubDecay = Math.min(0.1, maxDur * 0.55);
    const dubDecay = Math.min(0.08, maxDur * 0.45);
    const dubGap = Math.max(0.032, cycleSec * 0.24);

    thump(t, 55, v, lubDecay);
    thump(t, 40, v * 0.5, lubDecay + 0.012);
    thump(t + dubGap, 50, v * 0.65, dubDecay);
    thump(t + dubGap, 36, v * 0.4, dubDecay + 0.01);
  } catch {
    /* Web Audio indisponível */
  }
}

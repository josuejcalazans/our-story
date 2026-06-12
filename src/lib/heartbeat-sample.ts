const SAMPLE_URL = "/audio/heartbeat.mp3";
const REF_BPM = 55;

let buffer: AudioBuffer | null = null;
let loading: Promise<AudioBuffer | null> | null = null;

export async function loadHeartbeatSample(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (buffer) return buffer;
  if (loading) return loading;

  loading = (async () => {
    try {
      const res = await fetch(SAMPLE_URL);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      buffer = await ctx.decodeAudioData(arr);
      return buffer;
    } catch {
      return null;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

/** Camada de textura do sample — volume baixo, sincronizado ao BPM */
export function playHeartbeatSampleLayer(
  ctx: AudioContext,
  dest: AudioNode,
  bpm: number,
  when = ctx.currentTime,
): void {
  if (!buffer) return;

  const rate = bpm / REF_BPM;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(0.18, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.45 / rate);

  src.connect(gain);
  gain.connect(dest);

  const slice = Math.min(buffer.duration, 0.5 / rate);
  src.start(when, 0, slice);
}

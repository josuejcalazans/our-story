/** Tempo mínimo do loader antes de mostrar senha ou história */
export const STORY_LOADER_MIN_MS = 7000;

/** A partir daqui a linha e os batimentos aceleram */
export const HEARTBEAT_ACCELERATE_AT_MS = 3000;

export const HEARTBEAT_CYCLE_SLOW_MS = 2400;
export const HEARTBEAT_CYCLE_FAST_MS = 780;

const LUB_IN_CYCLE = 0.12;
const DUB_IN_CYCLE = 0.34;

export type BeatPulse = { atMs: number; kind: "lub" | "dub" };

export function getHeartbeatCycleMs(elapsedMs: number): number {
  if (elapsedMs < HEARTBEAT_ACCELERATE_AT_MS) return HEARTBEAT_CYCLE_SLOW_MS;

  const rampMs = STORY_LOADER_MIN_MS - HEARTBEAT_ACCELERATE_AT_MS;
  const t = Math.min(1, (elapsedMs - HEARTBEAT_ACCELERATE_AT_MS) / rampMs);
  const eased = t * t * t;

  return Math.round(
    HEARTBEAT_CYCLE_SLOW_MS -
      (HEARTBEAT_CYCLE_SLOW_MS - HEARTBEAT_CYCLE_FAST_MS) * eased,
  );
}

/** Progresso único da linha (0 → 1), sem repetir — lento até 3s, acelera até 7s */
export function getEcgDrawProgress(elapsedMs: number): number {
  if (elapsedMs >= STORY_LOADER_MIN_MS) return 1;
  if (elapsedMs <= 0) return 0;

  const slowShare = 0.18;

  if (elapsedMs < HEARTBEAT_ACCELERATE_AT_MS) {
    return slowShare * (elapsedMs / HEARTBEAT_ACCELERATE_AT_MS);
  }

  const ramp =
    (elapsedMs - HEARTBEAT_ACCELERATE_AT_MS) /
    (STORY_LOADER_MIN_MS - HEARTBEAT_ACCELERATE_AT_MS);
  const eased = ramp * ramp * ramp;
  return slowShare + (1 - slowShare) * eased;
}

export function buildBeatSchedule(durationMs = STORY_LOADER_MIN_MS): BeatPulse[] {
  const pulses: BeatPulse[] = [];
  let cycleStart = 0;

  while (cycleStart < durationMs) {
    const cycleMs = getHeartbeatCycleMs(cycleStart);
    const lubAt = cycleStart + LUB_IN_CYCLE * cycleMs;
    const dubAt = cycleStart + DUB_IN_CYCLE * cycleMs;
    if (lubAt < durationMs) pulses.push({ atMs: lubAt, kind: "lub" });
    if (dubAt < durationMs) pulses.push({ atMs: dubAt, kind: "dub" });
    cycleStart += cycleMs;
  }

  return pulses.sort((a, b) => a.atMs - b.atMs);
}

/** Linha ECG contínua — picos espaçados conforme o tempo de cada batida */
export function buildEcgPath(schedule: BeatPulse[], width = 900): string {
  const lubs = schedule.filter((b) => b.kind === "lub");
  if (lubs.length === 0) return `M 0 28 H ${width}`;

  let d = "M 0 28";
  let cursorX = 0;

  for (let i = 0; i < lubs.length; i++) {
    const nextLub = lubs[i + 1];
    const tEnd = nextLub ? nextLub.atMs : STORY_LOADER_MIN_MS;
    const xEnd = (tEnd / STORY_LOADER_MIN_MS) * width;
    const seg = xEnd - cursorX;
    if (seg < 6) continue;

    d += ` H${cursorX + seg * 0.18}`;
    d += ` L${cursorX + seg * 0.28} 9 L${cursorX + seg * 0.36} 47 L${cursorX + seg * 0.44} 28`;
    d += ` H${xEnd}`;
    cursorX = xEnd;
  }

  if (cursorX < width) d += ` H${width}`;
  return d;
}

export function getHeartScale(elapsedMs: number, schedule: BeatPulse[]): number {
  let scale = 1;

  for (const pulse of schedule) {
    const dt = elapsedMs - pulse.atMs;
    const window = pulse.kind === "lub" ? 300 : 220;
    const peak = pulse.kind === "lub" ? 0.28 : 0.12;
    if (dt < 0 || dt > window) continue;
    const x = dt / window;
    const bump = peak * Math.sin(Math.PI * x) * (1 - x * 0.35);
    scale = Math.max(scale, 1 + bump);
  }

  return scale;
}

export function getLubDubOffsetsSec(cycleMs: number) {
  const cycleSec = cycleMs / 1000;
  return {
    cycleSec,
    lubAtSec: LUB_IN_CYCLE * cycleSec,
    dubAtSec: DUB_IN_CYCLE * cycleSec,
  };
}

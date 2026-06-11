/** Tempo mínimo do loader antes de mostrar senha ou história */
export const STORY_LOADER_MIN_MS = 7000;

/** A partir dos 3s entra o tutututu acelerado */
export const HEARTBEAT_ACCELERATE_AT_MS = 3000;

/** Baseline plana antes do primeiro pico */
export const HEARTBEAT_INITIAL_FLAT_MS = 120;

/** Ritmo calmo nos primeiros 3s */
export const HEARTBEAT_CYCLE_SLOW_MS = 880;
/** Fim bem rápido — quase corrida */
export const HEARTBEAT_CYCLE_FAST_MS = 155;

const LUB_IN_CYCLE = 0.12;
const DUB_IN_CYCLE = 0.34;

const BASELINE_Y = 28;

export type BeatPulse = { atMs: number; kind: "lub" | "dub" };

export function getHeartbeatCycleMs(elapsedMs: number): number {
  if (elapsedMs < HEARTBEAT_ACCELERATE_AT_MS) return HEARTBEAT_CYCLE_SLOW_MS;

  const rampMs = STORY_LOADER_MIN_MS - HEARTBEAT_ACCELERATE_AT_MS;
  const t = Math.min(1, (elapsedMs - HEARTBEAT_ACCELERATE_AT_MS) / rampMs);
  // Explode no final da rampa (3s → 7s)
  const eased = t * t * t * t * t;

  return Math.round(
    HEARTBEAT_CYCLE_SLOW_MS -
      (HEARTBEAT_CYCLE_SLOW_MS - HEARTBEAT_CYCLE_FAST_MS) * eased,
  );
}

/** Posição horizontal na linha = tempo (0 → 1) */
export function getEcgDrawProgress(elapsedMs: number): number {
  if (elapsedMs >= STORY_LOADER_MIN_MS) return 1;
  if (elapsedMs <= 0) return 0;
  return elapsedMs / STORY_LOADER_MIN_MS;
}

export function timeToPathX(ms: number, pathWidth: number): number {
  return (ms / STORY_LOADER_MIN_MS) * pathWidth;
}

export function buildBeatSchedule(durationMs = STORY_LOADER_MIN_MS): BeatPulse[] {
  const pulses: BeatPulse[] = [];
  let cycleStart = HEARTBEAT_INITIAL_FLAT_MS;

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

function beatWidthPx(
  lubs: BeatPulse[],
  index: number,
  pathWidth: number,
): number {
  const lub = lubs[index];
  if (!lub) return 60;
  const cx = timeToPathX(lub.atMs, pathWidth);
  const next = lubs[index + 1];
  if (!next) return Math.min(95, Math.max(40, pathWidth - cx - 8));
  const nextCx = timeToPathX(next.atMs, pathWidth);
  return Math.max(26, Math.min(105, (nextCx - cx) * 0.9));
}

/** Complexo P → QRS → T (formato clássico do ECG) */
function appendEcgComplex(cx: number, w: number): string {
  const y = BASELINE_Y;
  const x = (f: number) => cx + f * w;

  return [
    `H${x(-0.44).toFixed(1)}`,
    `L${x(-0.36).toFixed(1)} ${y - 3}`,
    `L${x(-0.28).toFixed(1)} ${y}`,
    `L${x(-0.20).toFixed(1)} ${y + 2}`,
    `L${x(-0.11).toFixed(1)} ${y - 22}`,
    `L${x(-0.03).toFixed(1)} ${y + 20}`,
    `L${x(0.05).toFixed(1)} ${y}`,
    `L${x(0.12).toFixed(1)} ${y - 5}`,
    `L${x(0.20).toFixed(1)} ${y}`,
  ].join(" ");
}

/** Linha contínua: baseline plana no início, picos mais próximos com o tempo */
export function buildEcgPath(schedule: BeatPulse[], pathWidth = 1000): string {
  const lubs = schedule.filter((b) => b.kind === "lub");
  if (lubs.length === 0) return `M 0 ${BASELINE_Y} H ${pathWidth}`;

  const first = lubs[0];
  if (!first) return `M 0 ${BASELINE_Y} H ${pathWidth}`;
  const firstCx = timeToPathX(first.atMs, pathWidth);
  const firstW = beatWidthPx(lubs, 0, pathWidth);

  let d = `M 0 ${BASELINE_Y} H ${Math.max(0, firstCx - firstW * 0.48).toFixed(1)}`;

  for (let i = 0; i < lubs.length; i++) {
    const lub = lubs[i];
    if (!lub) continue;
    const cx = timeToPathX(lub.atMs, pathWidth);
    const w = beatWidthPx(lubs, i, pathWidth);
    d += appendEcgComplex(cx, w);

    const next = lubs[i + 1];
    if (next) {
      const nextCx = timeToPathX(next.atMs, pathWidth);
      const nextW = beatWidthPx(lubs, i + 1, pathWidth);
      const flatEnd = nextCx - nextW * 0.44;
      const complexEnd = cx + w * 0.2;
      if (flatEnd > complexEnd + 2) {
        d += ` H ${flatEnd.toFixed(1)}`;
      }
    }
  }

  d += ` H ${pathWidth}`;
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

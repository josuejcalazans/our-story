/** Tempo mínimo do loader antes de mostrar senha ou história */
export const STORY_LOADER_MIN_MS = 7000;

/** A partir daqui os batimentos começam a acelerar */
export const HEARTBEAT_ACCELERATE_AT_MS = 3000;

export const HEARTBEAT_CYCLE_SLOW_MS = 2400;
export const HEARTBEAT_CYCLE_FAST_MS = 780;

const LUB_AT_CYCLE = 0.12;
const DUB_AT_CYCLE = 0.34;

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

export function getLubDubOffsetsSec(cycleMs: number) {
  const cycleSec = cycleMs / 1000;
  return {
    cycleSec,
    lubAtSec: LUB_AT_CYCLE * cycleSec,
    dubAtSec: DUB_AT_CYCLE * cycleSec,
  };
}

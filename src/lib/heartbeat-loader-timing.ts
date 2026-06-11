/** Tempo mínimo do loader simples (StoryHeartbeatLoader) */
export const STORY_LOADER_MIN_MS = 7000;

/** Duração total do batimento na intro cinematográfica (estágios 2+3+4) */
export const CINEMATIC_HEART_MS = 16500;

/** Fade suave antes de parar — evita estouro no corte */
export const HEARTBEAT_FADE_OUT_MS = 900;

export function getHeartbeatAudioStopAtMs(totalMs: number = STORY_LOADER_MIN_MS) {
  return totalMs - HEARTBEAT_FADE_OUT_MS;
}

/** A partir daqui entra aceleração suave (loader simples) */
export const HEARTBEAT_ACCELERATE_AT_MS = 3000;

/** Baseline plana antes do primeiro pico */
export const HEARTBEAT_INITIAL_FLAT_MS = 120;

/** Ritmo calmo */
export const HEARTBEAT_CYCLE_SLOW_MS = 820;
/** Fim da aceleração — ainda lub-dub, sem tutututu */
export const HEARTBEAT_CYCLE_FAST_MS = 440;

export function getHeartbeatCycleMs(
  elapsedMs: number,
  totalMs: number = STORY_LOADER_MIN_MS,
  accelerateAtMs?: number,
): number {
  const accelerateAt = accelerateAtMs ?? Math.round(totalMs * 0.72);

  if (elapsedMs < accelerateAt) return HEARTBEAT_CYCLE_SLOW_MS;

  const rampMs = Math.max(1, totalMs - accelerateAt);
  const t = Math.min(1, (elapsedMs - accelerateAt) / rampMs);
  const eased = t ** 0.88;

  return Math.round(
    HEARTBEAT_CYCLE_SLOW_MS -
      (HEARTBEAT_CYCLE_SLOW_MS - HEARTBEAT_CYCLE_FAST_MS) * eased,
  );
}

export function cycleMsToBpm(cycleMs: number): number {
  return 60000 / cycleMs;
}

export function getHeartPulseScale(bpm: number): number {
  return 1 + 0.18 * Math.min(bpm / 120, 1.2);
}

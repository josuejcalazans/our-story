/** Tempo mínimo do loader antes de mostrar senha ou história */
export const STORY_LOADER_MIN_MS = 7000;

/** Fade suave antes de parar — evita estouro no corte */
export const HEARTBEAT_FADE_OUT_MS = 550;

export function getHeartbeatAudioStopAtMs() {
  return STORY_LOADER_MIN_MS - HEARTBEAT_FADE_OUT_MS;
}

/** A partir dos 3s entra o tutututu acelerado */
export const HEARTBEAT_ACCELERATE_AT_MS = 3000;

/** Baseline plana antes do primeiro pico */
export const HEARTBEAT_INITIAL_FLAT_MS = 120;

/** Ritmo calmo nos primeiros 3s */
export const HEARTBEAT_CYCLE_SLOW_MS = 820;
/** Fim em corrida — tutututu */
export const HEARTBEAT_CYCLE_FAST_MS = 155;

export function getHeartbeatCycleMs(elapsedMs: number): number {
  if (elapsedMs < HEARTBEAT_ACCELERATE_AT_MS) return HEARTBEAT_CYCLE_SLOW_MS;

  const rampMs = STORY_LOADER_MIN_MS - HEARTBEAT_ACCELERATE_AT_MS;
  const t = Math.min(1, (elapsedMs - HEARTBEAT_ACCELERATE_AT_MS) / rampMs);
  const eased = t ** 0.65;

  return Math.round(
    HEARTBEAT_CYCLE_SLOW_MS -
      (HEARTBEAT_CYCLE_SLOW_MS - HEARTBEAT_CYCLE_FAST_MS) * eased,
  );
}

export function cycleMsToBpm(cycleMs: number): number {
  return 60000 / cycleMs;
}

/** Escala do coração no pico — mesma curva do demo */
export function getHeartPulseScale(bpm: number): number {
  return 1 + 0.2 * Math.min(bpm / 120, 1.5);
}

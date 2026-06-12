/** Tempo mínimo do loader simples (StoryHeartbeatLoader) */
export const STORY_LOADER_MIN_MS = 7000;

/** Batimento ativo na intro: estágios 2+3+4 (3s + 3s + 4s) */
export const CINEMATIC_HEART_MS = 10000;

/** Fade suave antes de parar */
export const HEARTBEAT_FADE_OUT_MS = 700;

export function getHeartbeatAudioStopAtMs(totalMs: number = STORY_LOADER_MIN_MS) {
  return totalMs - HEARTBEAT_FADE_OUT_MS;
}

/** Loader simples */
export const HEARTBEAT_ACCELERATE_AT_MS = 3000;
export const HEARTBEAT_INITIAL_FLAT_MS = 120;
export const HEARTBEAT_CYCLE_SLOW_MS = 820;
export const HEARTBEAT_CYCLE_FAST_MS = 440;

/** Intro cinematográfica — BPM por fase */
export const CINEMATIC_BPM_SLOW = 55;
export const CINEMATIC_BPM_MID = 75;
export const CINEMATIC_BPM_FAST = 95;

/** Lub → Dub (ms) */
export const LUB_DUB_GAP_MS = 280;

const CINEMATIC_PHASE_2_END = 3000;
const CINEMATIC_PHASE_3_END = 6000;

export function getCinematicHeartbeatBpm(elapsedMs: number): number {
  if (elapsedMs < CINEMATIC_PHASE_2_END) return CINEMATIC_BPM_SLOW;

  if (elapsedMs < CINEMATIC_PHASE_3_END) {
    const t = (elapsedMs - CINEMATIC_PHASE_2_END) / (CINEMATIC_PHASE_3_END - CINEMATIC_PHASE_2_END);
    return CINEMATIC_BPM_SLOW + (CINEMATIC_BPM_MID - CINEMATIC_BPM_SLOW) * t;
  }

  const rampMs = CINEMATIC_HEART_MS - CINEMATIC_PHASE_3_END;
  const t = Math.min(1, (elapsedMs - CINEMATIC_PHASE_3_END) / rampMs);
  return CINEMATIC_BPM_MID + (CINEMATIC_BPM_FAST - CINEMATIC_BPM_MID) * t ** 0.85;
}

export function getCinematicHeartbeatCycleMs(elapsedMs: number): number {
  return Math.round(60000 / getCinematicHeartbeatBpm(elapsedMs));
}

export function getHeartbeatCycleMs(
  elapsedMs: number,
  totalMs: number = STORY_LOADER_MIN_MS,
  accelerateAtMs?: number,
): number {
  if (totalMs === CINEMATIC_HEART_MS) {
    return getCinematicHeartbeatCycleMs(elapsedMs);
  }

  const accelerateAt = accelerateAtMs ?? Math.round(totalMs * 0.72);
  if (elapsedMs < accelerateAt) return HEARTBEAT_CYCLE_SLOW_MS;

  const rampMs = Math.max(1, totalMs - accelerateAt);
  const t = Math.min(1, (elapsedMs - accelerateAt) / rampMs);
  const eased = t ** 0.88;

  return Math.round(
    HEARTBEAT_CYCLE_SLOW_MS - (HEARTBEAT_CYCLE_SLOW_MS - HEARTBEAT_CYCLE_FAST_MS) * eased,
  );
}

export function cycleMsToBpm(cycleMs: number): number {
  return 60000 / cycleMs;
}

export function getHeartPulseScale(bpm: number): number {
  return 1 + 0.2 * Math.min(Math.max(bpm - 50, 0) / 45, 1.25);
}

/** Intensidade do glow (0–1) conforme BPM sobe */
export function getHeartGlowIntensity(bpm: number): number {
  return 0.45 + 0.55 * Math.min(Math.max(bpm - 55, 0) / 40, 1);
}

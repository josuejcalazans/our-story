import { useEffect, useRef } from "react";
import {
  drawEcgFrame,
  ECG_CANVAS_HEIGHT,
  ECG_CANVAS_WIDTH,
  type EcgSegments,
  queueEcgBeat,
} from "@/lib/heartbeat-ecg-canvas";
import {
  cycleMsToBpm,
  getCinematicHeartbeatBpm,
  getHeartbeatCycleMs,
  STORY_LOADER_MIN_MS,
  CINEMATIC_HEART_MS,
} from "@/lib/heartbeat-loader-timing";

export default function EcgContinuousLine({
  elapsedMs,
  beatKey,
  running = true,
  totalMs = STORY_LOADER_MIN_MS,
  bpm,
}: {
  elapsedMs: number;
  beatKey: number;
  running?: boolean;
  totalMs?: number;
  bpm?: number;
}) {
  const resolveBpm = (elapsed: number) =>
    bpm ?? (totalMs === CINEMATIC_HEART_MS ? getCinematicHeartbeatBpm(elapsed) : cycleMsToBpm(getHeartbeatCycleMs(elapsed, totalMs)));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmentsRef = useRef<EcgSegments>({});
  const headXRef = useRef(0);
  const viewXRef = useRef(0);
  const prevTsRef = useRef<number | null>(null);
  const lastBeatKeyRef = useRef(-1);
  const elapsedRef = useRef(elapsedMs);
  elapsedRef.current = elapsedMs;

  useEffect(() => {
    if (!running || beatKey === lastBeatKeyRef.current) return;
    lastBeatKeyRef.current = beatKey;
    queueEcgBeat(segmentsRef.current, headXRef.current, resolveBpm(elapsedRef.current));
  }, [beatKey, running, totalMs, bpm]);

  useEffect(() => {
    if (!running) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const tick = (ts: number) => {
      if (prevTsRef.current === null) prevTsRef.current = ts;
      const dt = Math.min((ts - prevTsRef.current) / 1000, 0.05);
      prevTsRef.current = ts;

      const currentBpm = resolveBpm(elapsedRef.current);
      headXRef.current += (55 + currentBpm * 0.75) * dt;

      const headFloor = Math.floor(headXRef.current);
      if (segmentsRef.current[headFloor] === undefined) {
        segmentsRef.current[headFloor] = ECG_CANVAS_HEIGHT / 2;
      }

      if (headXRef.current > viewXRef.current + ECG_CANVAS_WIDTH * 0.8) {
        viewXRef.current = headXRef.current - ECG_CANVAS_WIDTH * 0.8;
      }

      drawEcgFrame(ctx, segmentsRef.current, headXRef.current, viewXRef.current, currentBpm);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, totalMs, bpm]);

  return (
    <div
      className="relative mx-auto w-full max-w-xs"
      style={{ filter: "drop-shadow(0 0 6px rgba(244, 114, 182, 0.55))" }}
    >
      <canvas
        ref={canvasRef}
        width={ECG_CANVAS_WIDTH}
        height={ECG_CANVAS_HEIGHT}
        className="block h-20 w-full"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {elapsedMs > 80 && elapsedMs < totalMs - 50 && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background/70 to-transparent" />
      )}
    </div>
  );
}

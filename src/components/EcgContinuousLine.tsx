import { useId, useMemo } from "react";
import {
  buildBeatSchedule,
  buildEcgPath,
  getEcgDrawProgress,
} from "@/lib/heartbeat-loader-timing";

const VIEW_WIDTH = 300;
const PATH_WIDTH = 1000;
const VIEW_HEIGHT = 56;

export default function EcgContinuousLine({ elapsedMs }: { elapsedMs: number }) {
  const maskId = useId();
  const glowId = useId();
  const schedule = useMemo(() => buildBeatSchedule(), []);
  const pathD = useMemo(() => buildEcgPath(schedule, PATH_WIDTH), [schedule]);
  const progress = getEcgDrawProgress(elapsedMs);
  const headX = progress * PATH_WIDTH;
  const panX = Math.max(0, headX - VIEW_WIDTH * 0.7);
  const revealW = Math.max(0, headX - panX);

  return (
    <div className="relative w-64 max-w-[78vw]">
      <svg
        viewBox={`${panX} 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-14 w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <title>Linha do eletrocardiograma</title>
        <defs>
          <mask id={maskId}>
            <rect x={panX} y={0} width={revealW} height={VIEW_HEIGHT} fill="white" />
          </mask>
          <filter id={glowId} x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="oklch(0.74 0.21 350)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          mask={`url(#${maskId})`}
          filter={`url(#${glowId})`}
        />
      </svg>
      {progress > 0.01 && progress < 0.995 && (
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-accent/80 shadow-[0_0_12px_oklch(0.74_0.21_350_/_0.9)]"
          style={{ left: `${Math.min(98, (revealW / VIEW_WIDTH) * 100)}%` }}
        />
      )}
    </div>
  );
}

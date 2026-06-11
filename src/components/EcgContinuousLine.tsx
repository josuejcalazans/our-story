import { useMemo } from "react";
import {
  buildBeatSchedule,
  buildEcgPath,
  getEcgDrawProgress,
} from "@/lib/heartbeat-loader-timing";

const VIEW_WIDTH = 280;
const PATH_WIDTH = 900;

export default function EcgContinuousLine({ elapsedMs }: { elapsedMs: number }) {
  const schedule = useMemo(() => buildBeatSchedule(), []);
  const pathD = useMemo(() => buildEcgPath(schedule, PATH_WIDTH), [schedule]);
  const progress = getEcgDrawProgress(elapsedMs);
  const panX = progress * (PATH_WIDTH - VIEW_WIDTH);
  const headX = ((panX + VIEW_WIDTH * 0.88) / VIEW_WIDTH) * 100;

  return (
    <div className="relative w-56 max-w-[70vw] overflow-hidden">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} 56`}
        className="h-12 w-full text-accent/90"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <title>Linha do eletrocardiograma</title>
        <defs>
          <linearGradient id="ecg-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.74 0.21 350 / 0)" />
            <stop offset="45%" stopColor="oklch(0.74 0.21 350 / 0.9)" />
            <stop offset="100%" stopColor="oklch(0.66 0.25 305 / 0.2)" />
          </linearGradient>
        </defs>
        <g transform={`translate(${-panX} 0)`}>
          <path
            d={pathD}
            fill="none"
            stroke="url(#ecg-glow)"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      <div
        className="pointer-events-none absolute inset-y-0 w-10"
        style={{
          left: `calc(${Math.min(100, headX)}% - 1.25rem)`,
          background:
            "linear-gradient(90deg, transparent, oklch(0.74 0.21 350 / 0.4), transparent)",
          opacity: progress > 0.02 && progress < 0.99 ? 0.85 : 0,
          transition: "opacity 0.2s",
        }}
      />
    </div>
  );
}

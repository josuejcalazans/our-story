import { useMemo } from "react";
import {
  buildBeatSchedule,
  buildEcgPath,
  timeToPathX,
} from "@/lib/heartbeat-loader-timing";

const VIEW_WIDTH = 300;
const PATH_WIDTH = 1000;
const VIEW_HEIGHT = 56;

export default function EcgContinuousLine({ elapsedMs }: { elapsedMs: number }) {
  const schedule = useMemo(() => buildBeatSchedule(), []);
  const pathD = useMemo(() => buildEcgPath(schedule, PATH_WIDTH), [schedule]);
  const headX = timeToPathX(elapsedMs, PATH_WIDTH);
  const viewStart = Math.max(0, headX - VIEW_WIDTH * 0.72);
  const headInView = ((headX - viewStart) / VIEW_WIDTH) * 100;

  return (
    <div
      className="relative w-64 max-w-[78vw] overflow-hidden"
      style={{ filter: "drop-shadow(0 0 6px rgba(244, 114, 182, 0.55))" }}
    >
      <svg
        viewBox={`${viewStart} 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-14 w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
        role="img"
      >
        <title>Linha do eletrocardiograma</title>
        <path
          d={pathD}
          fill="none"
          stroke="#f472b6"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {elapsedMs > 80 && elapsedMs < 6950 && (
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-pink-400/90"
          style={{ left: `${Math.min(96, Math.max(2, headInView))}%` }}
        />
      )}
    </div>
  );
}

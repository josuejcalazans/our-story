export const ECG_CANVAS_WIDTH = 680;
export const ECG_CANVAS_HEIGHT = 160;
const MID = ECG_CANVAS_HEIGHT / 2;

export type EcgSegments = Record<number, number>;

export type EcgDrawColors = {
  background: string;
  grid: string;
  line: string;
  head: string;
};

/** Cores do loader — rosa accent do projeto */
export const LOADER_ECG_COLORS: EcgDrawColors = {
  background: "transparent",
  grid: "rgba(244, 114, 182, 0.25)",
  line: "#f472b6",
  head: "#fbcfe8",
};

/** Forma do complexo QRS — mesma fórmula do demo que funciona */
export function buildEcgBeatPoints(startX: number, bpm: number, midY = MID) {
  const spike = Math.min(100, 36 + bpm * 0.37);
  return (
    [
      [0, 0],
      [6, -7],
      [12, 0],
      [18, 5],
      [22, -spike],
      [27, 16],
      [33, 0],
      [42, -11],
      [53, 0],
    ] as const
  ).map(([dx, dy]) => ({ x: startX + dx, y: midY + dy }));
}

export function queueEcgBeat(
  segments: EcgSegments,
  headX: number,
  bpm: number,
  midY = MID,
) {
  const shape = buildEcgBeatPoints(headX + 4, bpm, midY);
  for (let i = 0; i < shape.length - 1; i++) {
    const p0 = shape[i];
    const p1 = shape[i + 1];
    if (!p0 || !p1) continue;
    const steps = Math.max(1, Math.abs(Math.round(p1.x) - Math.round(p0.x)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(p0.x + (p1.x - p0.x) * t);
      segments[x] = p0.y + (p1.y - p0.y) * t;
    }
  }
}

export function drawEcgFrame(
  ctx: CanvasRenderingContext2D,
  segments: EcgSegments,
  headX: number,
  viewX: number,
  currentBpm: number,
  colors: EcgDrawColors = LOADER_ECG_COLORS,
) {
  const W = ECG_CANVAS_WIDTH;
  const H = ECG_CANVAS_HEIGHT;

  ctx.clearRect(0, 0, W, H);
  if (colors.background !== "transparent") {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 0.5;
  for (let y = 0; y < H; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  const glow = Math.min(1, (currentBpm - 60) / 120);
  const r = 244 + Math.round(glow * 11);
  const g = 114 + Math.round(glow * 20);
  const b = 182 + Math.round(glow * 10);
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  let started = false;
  for (let wx = Math.floor(viewX); wx <= Math.floor(headX); wx++) {
    const sx = wx - viewX;
    const sy = segments[wx] ?? MID;
    if (!started) {
      ctx.moveTo(sx, sy);
      started = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();

  ctx.fillStyle = colors.head;
  ctx.beginPath();
  ctx.arc(headX - viewX, segments[Math.floor(headX)] ?? MID, 3.5, 0, Math.PI * 2);
  ctx.fill();

  const ex = headX - viewX + 2;
  if (ex < W) {
    if (colors.background !== "transparent") {
      ctx.fillStyle = colors.background;
      ctx.fillRect(ex, 0, Math.min(35, W - ex), H);
    }
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath();
      ctx.moveTo(ex, y);
      ctx.lineTo(Math.min(W, ex + 35), y);
      ctx.stroke();
    }
  }
}

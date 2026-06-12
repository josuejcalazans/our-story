import type { StyledQROptions } from "@/lib/qr-config";
import { createExportCanvas, renderQRSourceCanvas } from "@/lib/qr-export";

/** A6 em 300 DPI — ideal para cartão impresso */
export const PRINT_CARD_WIDTH = 1240;
export const PRINT_CARD_HEIGHT = 1748;

export type PrintCardLayout = {
  herName?: string | null;
  tagline?: string;
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCardBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, PRINT_CARD_WIDTH, PRINT_CARD_HEIGHT);
  bg.addColorStop(0, "#0a0414");
  bg.addColorStop(0.45, "#160c28");
  bg.addColorStop(1, "#1f1235");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, PRINT_CARD_WIDTH, PRINT_CARD_HEIGHT);

  const glow = ctx.createRadialGradient(
    PRINT_CARD_WIDTH / 2,
    PRINT_CARD_HEIGHT * 0.38,
    40,
    PRINT_CARD_WIDTH / 2,
    PRINT_CARD_HEIGHT * 0.38,
    PRINT_CARD_WIDTH * 0.55,
  );
  glow.addColorStop(0, "rgba(168, 85, 247, 0.22)");
  glow.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, PRINT_CARD_WIDTH, PRINT_CARD_HEIGHT);

  ctx.strokeStyle = "rgba(244, 114, 182, 0.22)";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 56, 56, PRINT_CARD_WIDTH - 112, PRINT_CARD_HEIGHT - 112, 36);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 72, 72, PRINT_CARD_WIDTH - 144, PRINT_CARD_HEIGHT - 144, 28);
  ctx.stroke();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#f472b6";
  ctx.translate(cx, cy);
  ctx.scale(size / 24, size / 24);
  ctx.beginPath();
  ctx.moveTo(12, 21);
  ctx.bezierCurveTo(12, 21, 2, 14, 2, 8.5);
  ctx.bezierCurveTo(2, 5, 4.5, 2.5, 8, 2.5);
  ctx.bezierCurveTo(10, 2.5, 12, 4, 12, 4);
  ctx.bezierCurveTo(12, 4, 14, 2.5, 16, 2.5);
  ctx.bezierCurveTo(19.5, 2.5, 22, 5, 22, 8.5);
  ctx.bezierCurveTo(22, 14, 12, 21, 12, 21);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDecorativeHearts(ctx: CanvasRenderingContext2D) {
  const spots = [
    [180, 220, 14, 0.12],
    [1020, 280, 18, 0.1],
    [140, 1480, 16, 0.08],
    [1080, 1520, 12, 0.1],
    [620, 160, 10, 0.07],
  ] as const;

  for (const [x, y, size, alpha] of spots) {
    drawHeart(ctx, x, y, size, alpha);
  }
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string,
  fill: string,
  maxWidth?: number,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (maxWidth) {
    let size = Number.parseInt(font, 10);
    while (size > 28 && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = font.replace(/^\d+px/, `${size}px`);
    }
  }

  ctx.fillText(text, PRINT_CARD_WIDTH / 2, y);
  ctx.restore();
}

export async function renderPrintCardCanvas(
  options: StyledQROptions,
  qrMargin: number,
  layout: PrintCardLayout = {},
): Promise<HTMLCanvasElement> {
  const qrSize = 520;
  const sourceQr = await renderQRSourceCanvas({ ...options, size: qrSize }, qrSize);
  const qrWithBorder = createExportCanvas(sourceQr, options.bgColor, qrMargin);

  const canvas = document.createElement("canvas");
  canvas.width = PRINT_CARD_WIDTH;
  canvas.height = PRINT_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create print card canvas");

  drawCardBackground(ctx);
  drawDecorativeHearts(ctx);

  const herName = layout.herName?.trim();
  const title = herName ? `Para ${herName}` : "Nossa História";
  const tagline = layout.tagline ?? "Algo feito só para você";

  drawCenteredText(
    ctx,
    title,
    220,
    "600 56px Georgia, 'Times New Roman', serif",
    "#e9d5ff",
    PRINT_CARD_WIDTH - 200,
  );

  const titleGradient = ctx.createLinearGradient(
    PRINT_CARD_WIDTH / 2 - 200,
    300,
    PRINT_CARD_WIDTH / 2 + 200,
    300,
  );
  titleGradient.addColorStop(0, "#c084fc");
  titleGradient.addColorStop(1, "#f472b6");
  ctx.save();
  ctx.font = "italic 32px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = titleGradient;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tagline, PRINT_CARD_WIDTH / 2, 300);
  ctx.restore();

  const qrX = (PRINT_CARD_WIDTH - qrWithBorder.width) / 2;
  const qrY = 420;
  ctx.save();
  ctx.shadowColor = "rgba(244, 114, 182, 0.35)";
  ctx.shadowBlur = 48;
  ctx.drawImage(qrWithBorder, qrX, qrY);
  ctx.restore();

  drawCenteredText(
    ctx,
    "Escaneie para abrir",
    qrY + qrWithBorder.height + 72,
    "500 28px system-ui, sans-serif",
    "rgba(255, 255, 255, 0.55)",
  );
  drawCenteredText(
    ctx,
    "nossa história",
    qrY + qrWithBorder.height + 108,
    "italic 36px Georgia, 'Times New Roman', serif",
    "rgba(244, 114, 182, 0.85)",
  );

  drawHeart(ctx, PRINT_CARD_WIDTH / 2, PRINT_CARD_HEIGHT - 148, 22, 0.9);

  drawCenteredText(
    ctx,
    "COM AMOR",
    PRINT_CARD_HEIGHT - 96,
    "600 14px system-ui, sans-serif",
    "rgba(168, 85, 247, 0.55)",
  );

  return canvas;
}

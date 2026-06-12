import type { StyledQROptions } from "@/lib/qr-config";
import { createExportCanvas, renderQRSourceCanvas } from "@/lib/qr-export";

/** A6 em 300 DPI — ideal para cartão impresso */
export const PRINT_CARD_WIDTH = 1240;
export const PRINT_CARD_HEIGHT = 1748;

export type PrintCardLayout = {
  herName?: string | null;
  tagline?: string;
  scanLine?: string;
  backMessage?: string;
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

function drawCardFrame(ctx: CanvasRenderingContext2D) {
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
  fill: string | CanvasGradient,
  maxWidth?: number,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (maxWidth) {
    let size = Number.parseInt(font, 10);
    while (size > 24 && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = font.replace(/^\d+px/, `${size}px`);
    }
  }

  ctx.fillText(text, PRINT_CARD_WIDTH / 2, y);
  ctx.restore();
}

function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerY: number,
  font: string,
  fill: string | CanvasGradient,
  maxWidth: number,
  lineHeight: number,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const totalHeight = (lines.length - 1) * lineHeight;
  let y = centerY - totalHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, PRINT_CARD_WIDTH / 2, y);
    y += lineHeight;
  }

  ctx.restore();
}

function splitScanLine(scanLine: string) {
  const trimmed = scanLine.trim() || "Escaneie para abrir nossa história";
  const lower = trimmed.toLowerCase();
  const marker = "nossa história";
  const idx = lower.indexOf(marker);

  if (idx > 0) {
    return {
      top: trimmed.slice(0, idx).trim(),
      bottom: trimmed.slice(idx).trim(),
    };
  }

  return { top: trimmed, bottom: "nossa história" };
}

export async function renderPrintCardFrontCanvas(
  options: StyledQROptions,
  qrMargin: number,
  layout: PrintCardLayout = {},
  previewCanvas?: HTMLCanvasElement | null,
): Promise<HTMLCanvasElement> {
  const qrSize = 520;
  const sourceQr = await renderQRSourceCanvas(
    { ...options, size: qrSize },
    qrSize,
    previewCanvas,
  );
  const qrWithBorder = createExportCanvas(sourceQr, options.bgColor, qrMargin);

  const canvas = document.createElement("canvas");
  canvas.width = PRINT_CARD_WIDTH;
  canvas.height = PRINT_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create print card canvas");

  drawCardFrame(ctx);
  drawDecorativeHearts(ctx);

  const herName = layout.herName?.trim();
  const title = herName ? `Para ${herName}` : "Nossa História";
  const tagline = layout.tagline?.trim() || "Algo feito só para você";
  const scanParts = splitScanLine(layout.scanLine ?? "");

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
  drawCenteredText(
    ctx,
    tagline,
    300,
    "italic 32px Georgia, 'Times New Roman', serif",
    titleGradient,
    PRINT_CARD_WIDTH - 180,
  );

  const qrX = (PRINT_CARD_WIDTH - qrWithBorder.width) / 2;
  const qrY = 420;
  ctx.save();
  ctx.shadowColor = "rgba(244, 114, 182, 0.35)";
  ctx.shadowBlur = 48;
  ctx.drawImage(qrWithBorder, qrX, qrY);
  ctx.restore();

  const afterQr = qrY + qrWithBorder.height + 72;
  drawCenteredText(
    ctx,
    scanParts.top,
    afterQr,
    "500 28px system-ui, sans-serif",
    "rgba(255, 255, 255, 0.55)",
    PRINT_CARD_WIDTH - 160,
  );
  drawCenteredText(
    ctx,
    scanParts.bottom,
    afterQr + 36,
    "italic 36px Georgia, 'Times New Roman', serif",
    "rgba(244, 114, 182, 0.85)",
    PRINT_CARD_WIDTH - 160,
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

export async function renderPrintCardBackCanvas(
  layout: PrintCardLayout = {},
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = PRINT_CARD_WIDTH;
  canvas.height = PRINT_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create print card canvas");

  drawCardFrame(ctx);

  const herName = layout.herName?.trim();
  const defaultBack = herName
    ? `${herName},\n\neste QR guarda algo que preparei com todo meu coração.\n\nCom amor, para sempre.`
    : "Este QR guarda algo que preparei com todo meu coração.\n\nCom amor, para sempre.";
  const message = layout.backMessage?.trim() || defaultBack;
  const paragraphs = message.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  drawCenteredText(
    ctx,
    "VERSO",
    180,
    "600 13px system-ui, sans-serif",
    "rgba(168, 85, 247, 0.45)",
  );

  drawHeart(ctx, PRINT_CARD_WIDTH / 2, 300, 36, 0.85);

  const bodyGradient = ctx.createLinearGradient(
    PRINT_CARD_WIDTH / 2 - 220,
    500,
    PRINT_CARD_WIDTH / 2 + 220,
    500,
  );
  bodyGradient.addColorStop(0, "#f3e8ff");
  bodyGradient.addColorStop(1, "#fbcfe8");

  const blockHeight = paragraphs.length * 130;
  let y = 680 - blockHeight / 2 + 40;

  for (const paragraph of paragraphs) {
    drawMultilineText(
      ctx,
      paragraph,
      y,
      "italic 32px Georgia, 'Times New Roman', serif",
      bodyGradient,
      PRINT_CARD_WIDTH - 220,
      44,
    );
    y += 130;
  }

  drawCenteredText(
    ctx,
    herName ? `Para ${herName}` : "Nossa História",
    PRINT_CARD_HEIGHT - 180,
    "600 28px Georgia, 'Times New Roman', serif",
    "rgba(233, 213, 255, 0.75)",
    PRINT_CARD_WIDTH - 200,
  );

  drawHeart(ctx, PRINT_CARD_WIDTH / 2, PRINT_CARD_HEIGHT - 110, 18, 0.7);

  return canvas;
}

/** @deprecated Use renderPrintCardFrontCanvas */
export async function renderPrintCardCanvas(
  options: StyledQROptions,
  qrMargin: number,
  layout: PrintCardLayout = {},
): Promise<HTMLCanvasElement> {
  return renderPrintCardFrontCanvas(options, qrMargin, layout);
}

export async function renderPrintCardSheetCanvas(
  options: StyledQROptions,
  qrMargin: number,
  layout: PrintCardLayout = {},
  previewCanvas?: HTMLCanvasElement | null,
): Promise<HTMLCanvasElement> {
  const front = await renderPrintCardFrontCanvas(options, qrMargin, layout, previewCanvas);
  const back = await renderPrintCardBackCanvas(layout);

  const gap = 80;
  const sheet = document.createElement("canvas");
  sheet.width = PRINT_CARD_WIDTH;
  sheet.height = PRINT_CARD_HEIGHT * 2 + gap;
  const ctx = sheet.getContext("2d");
  if (!ctx) throw new Error("Could not create sheet canvas");

  ctx.fillStyle = "#050208";
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  ctx.drawImage(front, 0, 0);
  ctx.drawImage(back, 0, PRINT_CARD_HEIGHT + gap);

  ctx.strokeStyle = "rgba(244, 114, 182, 0.25)";
  ctx.setLineDash([12, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, PRINT_CARD_HEIGHT + gap / 2);
  ctx.lineTo(PRINT_CARD_WIDTH - 40, PRINT_CARD_HEIGHT + gap / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "500 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.textAlign = "center";
  ctx.fillText("— corte ou impressão frente / verso —", PRINT_CARD_WIDTH / 2, PRINT_CARD_HEIGHT + gap / 2 - 10);

  return sheet;
}

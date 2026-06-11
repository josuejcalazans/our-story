import QRCodeStyling from "qr-code-styling";
import { buildQRStylingConfig, type StyledQROptions } from "@/lib/qr-config";

export type ExportResolution = "preview" | "fhd" | "4k";

export const EXPORT_RESOLUTIONS: {
  value: ExportResolution;
  label: string;
  size: number | null;
}[] = [
  { value: "preview", label: "Preview", size: null },
  { value: "fhd", label: "Full HD", size: 1920 },
  { value: "4k", label: "4K", size: 3840 },
];

export function createExportCanvas(
  qrCanvas: HTMLCanvasElement,
  bgColor: string,
  margin: number,
): HTMLCanvasElement {
  const exportSize = qrCanvas.width + margin * 2;
  const borderRadius = Math.max(4, Math.round(margin * 0.5));
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportSize;
  exportCanvas.height = exportSize;
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not create export canvas");

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, exportSize, exportSize, borderRadius);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, exportSize, exportSize, borderRadius);
  ctx.clip();
  ctx.drawImage(qrCanvas, margin, margin);
  ctx.restore();

  return exportCanvas;
}

async function waitForQRRender(hasLogo: boolean) {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  if (hasLogo) {
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
  }
}

async function renderQRSourceCanvas(
  options: StyledQROptions,
  qrPixelSize: number,
): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  document.body.appendChild(container);

  try {
    const qr = new QRCodeStyling(
      buildQRStylingConfig({ ...options, size: qrPixelSize }),
    );
    qr.append(container);
    await waitForQRRender(Boolean(options.logoUrl));

    const canvas = container.querySelector("canvas");
    if (!canvas) throw new Error("QR canvas not found");
    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}

export async function renderExportCanvas(
  options: StyledQROptions,
  margin: number,
  resolution: ExportResolution,
  previewCanvas?: HTMLCanvasElement | null,
): Promise<HTMLCanvasElement> {
  const resolutionConfig = EXPORT_RESOLUTIONS.find((r) => r.value === resolution);
  const outputSize = resolutionConfig?.size ?? null;

  if (resolution === "preview" && previewCanvas) {
    return createExportCanvas(previewCanvas, options.bgColor, margin);
  }

  const qrPixelSize = outputSize ? outputSize - margin * 2 : options.size;
  const sourceCanvas = await renderQRSourceCanvas(options, qrPixelSize);
  return createExportCanvas(sourceCanvas, options.bgColor, margin);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create image blob"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

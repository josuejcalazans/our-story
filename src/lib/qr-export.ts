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

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const clone = document.createElement("canvas");
  clone.width = source.width;
  clone.height = source.height;
  const ctx = clone.getContext("2d");
  if (!ctx) throw new Error("Could not clone QR canvas");
  ctx.drawImage(source, 0, 0);
  return clone;
}

function scaleCanvas(source: HTMLCanvasElement, size: number): HTMLCanvasElement {
  const scaled = document.createElement("canvas");
  scaled.width = size;
  scaled.height = size;
  const ctx = scaled.getContext("2d");
  if (!ctx) throw new Error("Could not scale QR canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, size, size);
  return scaled;
}

async function blobToCanvas(blob: Blob, size: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create QR canvas context");

  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(blob);
    ctx.drawImage(bitmap, 0, 0, size, size);
    bitmap.close();
    return canvas;
  }

  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load QR image"));
      image.src = url;
    });
    ctx.drawImage(img, 0, 0, size, size);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function renderQRSourceCanvas(
  options: StyledQROptions,
  qrPixelSize: number,
  fallbackCanvas?: HTMLCanvasElement | null,
): Promise<HTMLCanvasElement> {
  if (!options.data.trim()) {
    throw new Error("QR data is empty");
  }

  try {
    const qr = new QRCodeStyling(
      buildQRStylingConfig({ ...options, size: qrPixelSize }),
    );
    const blob = await qr.getRawData("png");
    if (!blob || !(blob instanceof Blob)) {
      throw new Error("QR canvas not found");
    }
    return blobToCanvas(blob, qrPixelSize);
  } catch (error) {
    if (fallbackCanvas?.width && fallbackCanvas.height) {
      return fallbackCanvas.width === qrPixelSize
        ? cloneCanvas(fallbackCanvas)
        : scaleCanvas(fallbackCanvas, qrPixelSize);
    }
    throw error;
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

  if (resolution === "preview" && previewCanvas?.width && previewCanvas.height) {
    return createExportCanvas(cloneCanvas(previewCanvas), options.bgColor, margin);
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

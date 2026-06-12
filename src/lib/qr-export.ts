import {
  logoProcessPixelSize,
  resolveLogoForQrExport,
  upscaleLogoSquare,
} from "@/lib/image-fit";
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

/** Mantém a mesma proporção de borda do preview (ex.: 24px em 280px → ~330px em 4K) */
export function computeExportLayout(
  designQrSize: number,
  borderMargin: number,
  outputSize: number,
): { margin: number; qrPixelSize: number } {
  if (borderMargin <= 0) {
    return { margin: 0, qrPixelSize: outputSize };
  }

  const designTotal = designQrSize + borderMargin * 2;
  const margin = Math.max(1, Math.round(borderMargin * (outputSize / designTotal)));
  const qrPixelSize = Math.max(1, outputSize - margin * 2);
  return { margin, qrPixelSize };
}

export function scaleDesignMargin(
  borderMargin: number,
  designQrSize: number,
  targetQrSize: number,
): number {
  if (borderMargin <= 0) return 0;
  return Math.max(1, Math.round(borderMargin * (targetQrSize / Math.max(designQrSize, 1))));
}

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

function loadImageForExport(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a logo"));
    img.src = src;
  });
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

export async function prepareExportOptions(
  options: StyledQROptions,
  qrPixelSize: number,
): Promise<StyledQROptions> {
  const designQrSize = options.designQrSize ?? options.size;
  let logoUrl = options.logoUrl;

  if (logoUrl && qrPixelSize > designQrSize) {
    const exportLogoDisplay = options.logoSize * (qrPixelSize / designQrSize);
    const targetLogoSize = logoProcessPixelSize(qrPixelSize, exportLogoDisplay);

    const previewImg = await loadImageForExport(options.logoUrl);
    const upscaleFactor = targetLogoSize / Math.max(previewImg.naturalWidth, 1);

    if (upscaleFactor > 2.2 && options.logoRawSource) {
      logoUrl = await resolveLogoForQrExport(options.logoRawSource, {
        designQrSize,
        exportQrSize: qrPixelSize,
        logoDisplaySize: options.logoSize,
        logoFitMode: options.logoFitMode,
        logoFocalX: options.logoFocalX,
        logoFocalY: options.logoFocalY,
        logoZoom: options.logoZoom,
        bgColor: options.bgColor,
      });
    } else {
      logoUrl = await upscaleLogoSquare(options.logoUrl, targetLogoSize);
    }
  }

  return {
    ...options,
    size: qrPixelSize,
    designQrSize,
    logoUrl,
  };
}

export async function renderQRSourceCanvas(
  options: StyledQROptions,
  qrPixelSize: number,
  fallbackCanvas?: HTMLCanvasElement | null,
  /** Skip logo reprocessing when options were already prepared for this pixel size */
  alreadyPrepared = false,
): Promise<HTMLCanvasElement> {
  if (!options.data.trim()) {
    throw new Error("QR data is empty");
  }

  try {
    const exportOptions = alreadyPrepared
      ? { ...options, size: qrPixelSize }
      : await prepareExportOptions(options, qrPixelSize);
    const qr = new QRCodeStyling(buildQRStylingConfig(exportOptions));
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
  const designQrSize = options.designQrSize ?? options.size;

  if (resolution === "preview" && previewCanvas?.width && previewCanvas.height) {
    return createExportCanvas(cloneCanvas(previewCanvas), options.bgColor, margin);
  }

  if (!outputSize) {
    const sourceCanvas = await renderQRSourceCanvas(options, options.size);
    return createExportCanvas(sourceCanvas, options.bgColor, margin);
  }

  const { margin: scaledMargin, qrPixelSize } = computeExportLayout(
    designQrSize,
    margin,
    outputSize,
  );
  const sourceCanvas = await renderQRSourceCanvas(options, qrPixelSize);
  return createExportCanvas(sourceCanvas, options.bgColor, scaledMargin);
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

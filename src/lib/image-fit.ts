export type ImageFitMode = "cover" | "contain";

export type ImageFitOptions = {
  size?: number;
  mode?: ImageFitMode;
  /** 0–100 — ponto focal horizontal */
  focalX?: number;
  /** 0–100 — ponto focal vertical */
  focalY?: number;
  /** 1–2 — zoom extra no recorte */
  zoom?: number;
  bgColor?: string;
  /** @deprecated use PNG export — kept for API compat */
  quality?: number;
};

const MAX_IMAGE_EDGE = 2400;
export const MAX_LOGO_FILE_BYTES = 20 * 1024 * 1024;

/** Resolução da foto processada — sempre bem acima do tamanho exibido no QR */
export function logoProcessPixelSize(qrSize: number, logoSize: number) {
  const displayRatio = logoSize / Math.max(qrSize, 1);
  const target = Math.round(Math.max(qrSize, logoSize) * Math.max(4, displayRatio * 8));
  return Math.min(2048, Math.max(1024, target));
}

function canvasToSharpDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}

function drawImageSmooth(ctx: CanvasRenderingContext2D, img: HTMLImageElement, ...args: number[]) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, ...args);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem"));
    img.src = src;
  });
}

/** Reduz imagens enormes antes de processar — mantém qualidade para impressão */
export async function normalizeImageSource(
  source: string,
  maxEdge = MAX_IMAGE_EDGE,
): Promise<string> {
  const img = await loadImage(source);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= maxEdge) return source;

  const scale = maxEdge / longest;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  drawImageSmooth(ctx, img, 0, 0, canvas.width, canvas.height);
  return canvasToSharpDataUrl(canvas);
}

/** Encaixa qualquer proporção num quadrado — ideal para foto no centro do QR */
export async function fitImageToSquare(
  source: string,
  options: ImageFitOptions = {},
): Promise<string> {
  const {
    size = 512,
    mode = "cover",
    focalX = 50,
    focalY = 50,
    zoom = 1,
    bgColor = "#ffffff",
  } = options;

  const normalized = await normalizeImageSource(source);
  const img = await loadImage(normalized);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  const safeZoom = Math.max(1, Math.min(2, zoom));

  if (mode === "contain") {
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight) * safeZoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    drawImageSmooth(ctx, img, x, y, w, h);
  } else {
    const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight) * safeZoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const fx = Math.max(0, Math.min(100, focalX)) / 100;
    const fy = Math.max(0, Math.min(100, focalY)) / 100;
    const x = (size - w) * fx;
    const y = (size - h) * fy;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.clip();
    drawImageSmooth(ctx, img, x, y, w, h);
    ctx.restore();
  }

  return canvasToSharpDataUrl(canvas);
}

export async function readImageFileNormalized(file: File): Promise<string> {
  const { prepareImageForUpload } = await import("@/lib/prepare-upload-image");
  const ready = await prepareImageForUpload(file);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(ready);
  });
  return normalizeImageSource(dataUrl);
}

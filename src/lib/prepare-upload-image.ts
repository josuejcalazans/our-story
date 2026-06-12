import heic2any from "heic2any";

/** Qualidade JPEG na conversão HEIC → web (0.95 ≈ sem perda visível) */
const HEIC_JPEG_QUALITY = 0.95;

export function isHeicFile(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence"
  );
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: HEIC_JPEG_QUALITY,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error("Conversão HEIC falhou");
  }

  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "foto";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

/**
 * Converte HEIC/HEIF para JPEG antes do upload.
 * Outros formatos passam sem alteração.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  return convertHeicToJpeg(file);
}

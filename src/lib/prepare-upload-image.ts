import { supabase } from "@/integrations/supabase/client";

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

export function isHeicUrl(url: string | null | undefined) {
  if (!url?.trim()) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".heic") || path.endsWith(".heif");
  } catch {
    return /\.heic($|[?#])/i.test(url) || /\.heif($|[?#])/i.test(url);
  }
}

type SniffedFormat = "jpeg" | "png" | "webp" | "heic" | "unknown";

async function sniffImageFormat(blob: Blob): Promise<SniffedFormat> {
  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());

  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "jpeg";
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
    return "png";
  }
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return "webp";
  }

  const boxType = String.fromCharCode(header[4] ?? 0, header[5] ?? 0, header[6] ?? 0, header[7] ?? 0);
  if (boxType === "ftyp") return "heic";

  return "unknown";
}

async function rasterBlobToJpeg(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Falha ao gerar JPEG"))),
      "image/jpeg",
      HEIC_JPEG_QUALITY,
    );
  });
}

async function convertWithHeicTo(blob: Blob): Promise<Blob> {
  const { heicTo } = await import("heic-to");
  return heicTo({
    blob,
    type: "image/jpeg",
    quality: HEIC_JPEG_QUALITY,
  });
}

async function convertWithHeic2Any(blob: Blob): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob,
    toType: "image/jpeg",
    quality: HEIC_JPEG_QUALITY,
  });
  const result = Array.isArray(converted) ? converted[0] : converted;
  if (!(result instanceof Blob)) {
    throw new Error("Conversão HEIC falhou");
  }
  return result;
}

async function convertHeicBlobToJpeg(blob: Blob): Promise<Blob> {
  const format = await sniffImageFormat(blob);

  if (format === "jpeg") return blob;
  if (format === "png" || format === "webp") return rasterBlobToJpeg(blob);

  try {
    return await convertWithHeicTo(blob);
  } catch (primaryError) {
    try {
      return await convertWithHeic2Any(blob);
    } catch {
      const message =
        primaryError instanceof Error ? primaryError.message : "Formato HEIC não suportado";
      throw new Error(
        `${message}. Tente exportar a foto como JPEG no iPhone (Ajustes → Câmera → Formatos → Mais Compatível).`,
      );
    }
  }
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const blob = await convertHeicBlobToJpeg(file);
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

/** Gera URL exibível no navegador (object URL) a partir de um arquivo HEIC remoto. */
export async function heicUrlToDisplayUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Não foi possível carregar a imagem HEIC");
  }
  const blob = await response.blob();
  const jpeg = await convertHeicBlobToJpeg(blob);
  return URL.createObjectURL(jpeg);
}

/** Baixa HEIC do storage, converte e sobe JPEG — retorna a nova URL pública. */
export async function repairHeicImageUrl(heicUrl: string): Promise<string> {
  const response = await fetch(heicUrl);
  if (!response.ok) {
    throw new Error("Não foi possível baixar a foto HEIC");
  }

  const blob = await response.blob();
  const jpeg = await convertHeicBlobToJpeg(blob);
  const fileName = `${Math.random().toString(36).substring(2)}.jpg`;

  const { error } = await supabase.storage.from("assets").upload(fileName, jpeg, {
    contentType: "image/jpeg",
    cacheControl: "3600",
  });
  if (error) throw error;

  const { data } = supabase.storage.from("assets").getPublicUrl(fileName);
  return data.publicUrl;
}

import heic2any from "heic2any";
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

async function convertHeicBlobToJpeg(blob: Blob): Promise<Blob> {
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

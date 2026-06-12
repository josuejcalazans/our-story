import { supabase } from "@/integrations/supabase/client";
import type { ImageFitMode } from "@/lib/image-fit";
import { downloadBlob } from "@/lib/qr-export";
import type { CornerDotType, CornerSquareType, DotType } from "@/lib/qr-styles";

export type QRErrorLevel = "L" | "M" | "Q" | "H";

export type QRSavedConfig = {
  url: string;
  fgColor: string;
  bgColor: string;
  size: number;
  level: QRErrorLevel;
  logoUrl: string;
  logoSize: number;
  logoFitMode: ImageFitMode;
  logoFocalX: number;
  logoFocalY: number;
  logoZoom: number;
  logoExcavate: boolean;
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  includeMargin: boolean;
  borderMargin: number;
  savedAt: string;
};

export const QR_STORAGE_PATHS = {
  logo: "qr/logo.png",
  qrcode: "qr/saved-qrcode.png",
  cardSheet: "qr/saved-card-sheet.png",
  cardFront: "qr/saved-card-front.png",
} as const;

const EC_LEVELS = new Set<QRErrorLevel>(["L", "M", "Q", "H"]);
const FIT_MODES = new Set<ImageFitMode>(["cover", "contain"]);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseQRSavedConfig(raw: unknown): QRSavedConfig | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const url = asString(data.url).trim();
  if (!url) return null;

  const level = asString(data.level, "H") as QRErrorLevel;
  const logoFitMode = asString(data.logoFitMode, "cover") as ImageFitMode;

  return {
    url,
    fgColor: asString(data.fgColor, "#eb5e8e"),
    bgColor: asString(data.bgColor, "#ffffff"),
    size: asNumber(data.size, 280),
    level: EC_LEVELS.has(level) ? level : "H",
    logoUrl: asString(data.logoUrl),
    logoSize: asNumber(data.logoSize, 112),
    logoFitMode: FIT_MODES.has(logoFitMode) ? logoFitMode : "cover",
    logoFocalX: asNumber(data.logoFocalX, 50),
    logoFocalY: asNumber(data.logoFocalY, 42),
    logoZoom: asNumber(data.logoZoom, 108),
    logoExcavate: asBoolean(data.logoExcavate, true),
    dotStyle: asString(data.dotStyle, "rounded") as DotType,
    cornerSquareStyle: asString(data.cornerSquareStyle, "extra-rounded") as CornerSquareType,
    cornerDotStyle: asString(data.cornerDotStyle, "dot") as CornerDotType,
    includeMargin: asBoolean(data.includeMargin, true),
    borderMargin: asNumber(data.borderMargin, 24),
    savedAt: asString(data.savedAt, new Date().toISOString()),
  };
}

export async function uploadQrAsset(
  path: string,
  blob: Blob,
  contentType = "image/png",
): Promise<string> {
  const { error } = await supabase.storage.from("assets").upload(path, blob, {
    contentType,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("assets").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function ensureLogoStorageUrl(logoUrl: string): Promise<string> {
  if (!logoUrl) return "";
  if (!logoUrl.startsWith("data:")) {
    return logoUrl.split("?")[0] ?? logoUrl;
  }

  const response = await fetch(logoUrl);
  const blob = await response.blob();
  return uploadQrAsset(QR_STORAGE_PATHS.logo, blob, blob.type || "image/png");
}

export async function downloadRemoteAsset(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Não foi possível baixar o arquivo salvo");
  }
  const blob = await response.blob();
  downloadBlob(blob, filename);
}

export function formatSavedQrDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

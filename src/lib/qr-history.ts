import type { CornerDotType, CornerSquareType, DotType } from "@/lib/qr-styles";

export const QR_HISTORY_KEY = "qr-generator-history";
export const MAX_QR_HISTORY = 8;

export type QRHistoryItem = {
  id: string;
  text: string;
  fgColor: string;
  bgColor: string;
  size: number;
  level: "L" | "M" | "Q" | "H";
  logoUrl: string;
  logoSize: number;
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  createdAt: number;
};

/** Data URLs de logo podem ter vários MB — localStorage aguenta ~5MB no total */
export function sanitizeHistoryLogoUrl(logoUrl: string): string {
  if (!logoUrl) return "";
  if (logoUrl.startsWith("data:")) return "";
  if (logoUrl.startsWith("blob:")) return "";
  return logoUrl.split("?")[0] ?? logoUrl;
}

export function sanitizeHistoryItem(item: QRHistoryItem): QRHistoryItem {
  return {
    ...item,
    logoUrl: sanitizeHistoryLogoUrl(item.logoUrl),
  };
}

export function loadQrHistory(): QRHistoryItem[] {
  try {
    const raw = localStorage.getItem(QR_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QRHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeHistoryItem).slice(0, MAX_QR_HISTORY);
  } catch {
    return [];
  }
}

function tryPersist(payload: string): boolean {
  try {
    localStorage.setItem(QR_HISTORY_KEY, payload);
    return true;
  } catch {
    return false;
  }
}

/** Persiste histórico sem estourar quota — omite logos locais e reduz entradas se preciso */
export function persistQrHistory(items: QRHistoryItem[]): QRHistoryItem[] {
  const sanitized = items.map(sanitizeHistoryItem).slice(0, MAX_QR_HISTORY);

  if (tryPersist(JSON.stringify(sanitized))) {
    return sanitized;
  }

  const withoutLogos = sanitized.map((item) => ({ ...item, logoUrl: "" }));
  if (tryPersist(JSON.stringify(withoutLogos))) {
    return withoutLogos;
  }

  for (let limit = 3; limit >= 1; limit -= 1) {
    const trimmed = withoutLogos.slice(0, limit);
    if (tryPersist(JSON.stringify(trimmed))) {
      return trimmed;
    }
  }

  localStorage.removeItem(QR_HISTORY_KEY);
  return [];
}

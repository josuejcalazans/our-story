import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

const PARSE_FORMATS = [
  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd",
  "d MMMM yyyy",
  "dd MMMM yyyy",
  "d MMM yyyy",
  "dd MMM yyyy",
  "d/M/yyyy",
  "dd/MM/yyyy",
] as const;

function normalizeDateText(value: string) {
  return value
    .trim()
    .replace(/\bde\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseStoryDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const trimmed = normalizeDateText(value);

  // yyyy-MM-dd sem hora — evita deslocamento UTC no calendário
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const iso = new Date(trimmed);
    if (!Number.isNaN(iso.getTime())) return iso;
  }

  for (const pattern of PARSE_FORMATS) {
    const parsed = parse(trimmed, pattern, new Date(), { locale: ptBR });
    if (isValid(parsed)) return parsed;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Data só com dia/mês/ano no fuso local — para o calendário marcar o dia certo. */
export function toCalendarDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatStoryDateLong(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatStoryDateShort(date: Date): string {
  return format(date, "dd MMM yyyy", { locale: ptBR });
}

export function formatStoryDateParts(date: Date) {
  return {
    day: format(date, "dd", { locale: ptBR }),
    month: format(date, "MMM", { locale: ptBR }).replace(".", "").toUpperCase(),
    year: format(date, "yyyy", { locale: ptBR }),
    weekday: format(date, "EEEE", { locale: ptBR }),
    time: format(date, "HH:mm", { locale: ptBR }),
  };
}

export function formatStoryDateTime(date: Date): string {
  return `${formatStoryDateLong(date)} · ${format(date, "HH:mm", { locale: ptBR })}`;
}

export function toDateOnlyString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function toDateTimeLocalString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function isoFromDateAndTime(date: Date, hours: number, minutes: number): string {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

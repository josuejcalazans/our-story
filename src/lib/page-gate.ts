import { parseStoryDate } from "@/lib/story-date";

export const GATE_STORAGE_KEY = "our-story-gate-unlocked";

function toLocalDateParts(dateInput: string | Date) {
  const d =
    typeof dateInput === "string"
      ? parseStoryDate(dateInput)
      : parseStoryDate(
          `${dateInput.getFullYear()}-${String(dateInput.getMonth() + 1).padStart(2, "0")}-${String(dateInput.getDate()).padStart(2, "0")}`,
        ) ?? dateInput;

  if (!d || Number.isNaN(d.getTime())) return null;

  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
  };
}

/** Senha padrão: data no formato DDMMYYYY (ex.: 04022024) — sempre fuso local. */
export function formatAccessPassword(dateInput: string | Date): string {
  const parts = toLocalDateParts(dateInput);
  if (!parts) return "";
  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  const year = String(parts.year);
  return `${day}${month}${year}`;
}

export function normalizePasswordInput(input: string): string {
  return input.replace(/\D/g, "");
}

export function checkGatePassword(input: string, accessDate: string): boolean {
  const expected = formatAccessPassword(accessDate);
  if (!expected) return false;
  return normalizePasswordInput(input) === expected;
}

export function isGateUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(GATE_STORAGE_KEY) === "1";
}

export function unlockGate(): void {
  sessionStorage.setItem(GATE_STORAGE_KEY, "1");
}

export function formatAccessDateHint(dateInput: string): string {
  const parts = toLocalDateParts(dateInput);
  if (!parts) return "DDMMYYYY";
  const d = new Date(parts.year, parts.month - 1, parts.day);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

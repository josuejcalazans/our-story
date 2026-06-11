export const GATE_STORAGE_KEY = "our-story-gate-unlocked";

/** Senha padrão: data no formato DDMMYYYY (ex.: 01052023) */
export function formatAccessPassword(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
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
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "DDMMYYYY";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

import { useEffect, useMemo, useState } from "react";
import { CalendarHeart, ChevronDown, Clock3, KeyRound } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatStoryDateLong,
  formatStoryDateParts,
  formatStoryDateShort,
  isoFromDateAndTime,
  parseStoryDate,
  toCalendarDate,
  toDateOnlyString,
} from "@/lib/story-date";
import { ptBR } from "date-fns/locale";

/* ------------------------- Display ------------------------- */

export function StoryDateDisplay({
  value,
  align = "left",
  size = "md",
  showWeekday = false,
}: {
  value: string;
  align?: "left" | "right" | "center";
  size?: "sm" | "md";
  showWeekday?: boolean;
}) {
  const parsed = useMemo(() => parseStoryDate(value), [value]);
  const alignClass =
    align === "right" ? "ml-auto text-right" : align === "center" ? "mx-auto text-center" : "";

  if (!parsed) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-2xl bg-secondary/10 px-3 py-2 ring-1 ring-secondary/20",
          alignClass,
        )}
      >
        <CalendarHeart className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
        <span className="font-letter text-sm italic text-secondary">{value}</span>
      </div>
    );
  }

  const parts = formatStoryDateParts(parsed);

  return (
    <div className={cn("inline-flex", alignClass)}>
      <div
        className={cn(
          "group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-white/5 to-accent/10 px-3 py-2 ring-1 ring-primary/20 transition-all hover:ring-primary/40",
          size === "sm" ? "gap-2 px-2.5 py-1.5" : "px-3 py-2",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl bg-primary/20 font-display leading-none text-primary shadow-inner",
            size === "sm" ? "min-w-[2.5rem] px-2 py-1.5 text-xl" : "min-w-[3rem] px-2.5 py-2 text-2xl",
          )}
        >
          {parts.day}
        </div>
        <div className={cn("min-w-0", align === "right" && "text-right")}>
          {showWeekday && (
            <p className="text-[10px] capitalize tracking-wide text-muted-foreground/80">{parts.weekday}</p>
          )}
          <p
            className={cn(
              "font-medium uppercase tracking-[0.22em] text-secondary",
              size === "sm" ? "text-[10px]" : "text-xs",
            )}
          >
            {parts.month} · {parts.year}
          </p>
        </div>
        <CalendarHeart
          className={cn(
            "shrink-0 text-accent/60 transition-transform group-hover:scale-110",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}

/* ------------------------- Inline calendar (sem popover — mais confiável no painel) ------------------------- */

function InlineCalendarPanel({
  selected,
  onSelect,
  footer,
  className,
}: {
  selected?: Date;
  onSelect: (date: Date) => void;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-card shadow-glow",
        className,
      )}
    >
      <Calendar
        mode="single"
        selected={selected}
        defaultMonth={selected}
        onSelect={(date) => {
          if (date) onSelect(toCalendarDate(date));
        }}
        locale={ptBR}
        className="rounded-2xl p-3"
      />
      {footer}
    </div>
  );
}

export function GatePasswordPreview({ dateValue }: { dateValue: string }) {
  const parsed = parseStoryDate(dateValue);
  if (!parsed) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm text-muted-foreground">
        Escolha uma data para gerar a senha
      </div>
    );
  }

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  const password = `${day}${month}${year}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-white/[0.03] to-accent/10 p-5 ring-1 ring-primary/20">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5 text-accent" aria-hidden />
        Senha para compartilhar
      </div>
      <div className="relative mt-4 flex items-center justify-center gap-3">
        <div className="text-center">
          <p className="font-display text-4xl leading-none text-glow">{day}</p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">dia</p>
        </div>
        <span className="pb-4 text-xl text-accent/60">♥</span>
        <div className="text-center">
          <p className="font-display text-4xl leading-none text-glow">{month}</p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">mês</p>
        </div>
        <span className="pb-4 text-xl text-accent/60">♥</span>
        <div className="text-center">
          <p className="font-display text-4xl leading-none text-glow">{year}</p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">ano</p>
        </div>
      </div>
      <p className="relative mt-5 text-center font-mono text-lg tracking-[0.4em] text-primary">{password}</p>
      <p className="relative mt-2 text-center text-xs text-muted-foreground">
        Formato <span className="font-mono">DDMMYYYY</span> · só para quem deve entrar
      </p>
    </div>
  );
}

export function StoryDatePicker({
  value,
  onChange,
  mode = "date",
  placeholder = "Escolher data",
  variant = "default",
  className,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  mode?: "date" | "datetime";
  placeholder?: string;
  variant?: "default" | "compact";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseStoryDate(value ?? ""), [value]);
  const calendarSelected = parsed ? toCalendarDate(parsed) : undefined;
  const [hours, setHours] = useState(parsed ? parsed.getHours() : 20);
  const [minutes, setMinutes] = useState(parsed ? parsed.getMinutes() : 0);

  useEffect(() => {
    const d = parseStoryDate(value ?? "");
    if (!d) return;
    setHours(d.getHours());
    setMinutes(d.getMinutes());
  }, [value]);

  const label = parsed
    ? mode === "datetime"
      ? `${formatStoryDateLong(parsed)} · ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
      : formatStoryDateLong(parsed)
    : null;

  function pickDate(day: Date) {
    if (mode === "datetime") {
      onChange(isoFromDateAndTime(day, hours, minutes));
    } else {
      onChange(toDateOnlyString(day));
      setOpen(false);
    }
  }

  function applyTime(h: number, m: number) {
    const base = calendarSelected ?? new Date();
    onChange(isoFromDateAndTime(base, h, m));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
          <CalendarHeart className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {variant === "compact" && parsed ? (
            <StoryDateDisplay value={value ?? ""} size="sm" />
          ) : label ? (
            <>
              <p className="truncate text-sm font-medium text-foreground">{label}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {open ? "Fechar calendário" : mode === "datetime" ? "Data e hora do começo" : "Toque para alterar"}
              </p>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <InlineCalendarPanel
          selected={calendarSelected}
          onSelect={pickDate}
          className={variant === "compact" ? "bg-white/[0.03]" : undefined}
          footer={
            mode === "datetime" ? (
              <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
                <Clock3 className="h-4 w-4 text-accent" aria-hidden />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => {
                      const h = Math.min(23, Math.max(0, Number(e.target.value) || 0));
                      setHours(h);
                      applyTime(h, minutes);
                    }}
                    className="h-9 w-14 rounded-lg border-white/10 bg-white/5 text-center"
                  />
                  <span className="text-muted-foreground">:</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => {
                      const m = Math.min(59, Math.max(0, Number(e.target.value) || 0));
                      setMinutes(m);
                      applyTime(hours, m);
                    }}
                    className="h-9 w-14 rounded-lg border-white/10 bg-white/5 text-center"
                  />
                </div>
                <Button type="button" size="sm" onClick={() => setOpen(false)} className="ml-auto rounded-lg">
                  Pronto
                </Button>
              </div>
            ) : undefined
          }
        />
      )}
    </div>
  );
}

/** Timeline admin: calendário inline + texto livre. */
export function StoryDateTextPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseStoryDate(value), [value]);
  const calendarSelected = parsed ? toCalendarDate(parsed) : undefined;

  return (
    <div className={cn("space-y-3", className)}>
      {value && parsed && <StoryDateDisplay value={value} size="sm" />}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-white/[0.07] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
            <CalendarHeart className="h-4 w-4" aria-hidden />
          </div>
          <span className="text-sm text-muted-foreground">
            {open ? "Fechar calendário" : "Alterar pelo calendário"}
          </span>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <InlineCalendarPanel
          selected={calendarSelected}
          onSelect={(day) => {
            onChange(formatStoryDateShort(day));
            setOpen(false);
          }}
        />
      )}

      <Input
        placeholder="Ou digite: 12 jun 2023"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-white/5 bg-white/5 text-sm"
      />
    </div>
  );
}

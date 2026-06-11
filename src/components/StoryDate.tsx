import { useEffect, useMemo, useState } from "react";
import { CalendarHeart, Clock3 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatStoryDateLong,
  formatStoryDateParts,
  formatStoryDateShort,
  isoFromDateAndTime,
  parseStoryDate,
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

/* ------------------------- Pickers ------------------------- */

function StoryDateTrigger({
  children,
  className,
  emptyLabel,
}: {
  children: React.ReactNode;
  className?: string;
  emptyLabel?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer",
        className,
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
        <CalendarHeart className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">{children ?? <span className="text-sm text-muted-foreground">{emptyLabel}</span>}</div>
    </button>
  );
}

export function StoryDatePicker({
  value,
  onChange,
  mode = "date",
  placeholder = "Escolher data",
  className,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  mode?: "date" | "datetime";
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseStoryDate(value ?? ""), [value]);
  const [hours, setHours] = useState(parsed ? parsed.getHours() : 20);
  const [minutes, setMinutes] = useState(parsed ? parsed.getMinutes() : 0);

  useEffect(() => {
    const d = parseStoryDate(value ?? "");
    if (!d) return;
    setHours(d.getHours());
    setMinutes(d.getMinutes());
  }, [value]);

  const selected = parsed ?? undefined;
  const label = parsed
    ? mode === "datetime"
      ? `${formatStoryDateLong(parsed)} · ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
      : formatStoryDateLong(parsed)
    : null;

  function pickDate(date: Date | undefined) {
    if (!date) {
      onChange(null);
      return;
    }
    if (mode === "datetime") {
      onChange(isoFromDateAndTime(date, hours, minutes));
    } else {
      onChange(toDateOnlyString(date));
    }
  }

  function applyTime(h: number, m: number) {
    if (!parsed) return;
    onChange(isoFromDateAndTime(parsed, h, m));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <StoryDateTrigger className={className} emptyLabel={placeholder}>
          {label ? (
            <div>
              <p className="truncate text-sm font-medium text-foreground">{label}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {mode === "datetime" ? "Data e hora do começo" : "Toque para alterar"}
              </p>
            </div>
          ) : null}
        </StoryDateTrigger>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-2xl border-white/10 bg-card/95 p-0 shadow-glow backdrop-blur-xl"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            pickDate(date);
            if (mode === "date") setOpen(false);
          }}
          locale={ptBR}
          className="rounded-2xl"
        />
        {mode === "datetime" && (
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
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto text-xs text-primary hover:underline cursor-pointer"
            >
              Pronto
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Timeline admin: calendário + texto livre formatado em PT. */
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

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <StoryDateTrigger emptyLabel="Escolher data do momento">
            {value ? (
              parsed ? (
                <StoryDateDisplay value={value} size="sm" />
              ) : (
                <p className="truncate text-sm font-medium">{value}</p>
              )
            ) : null}
          </StoryDateTrigger>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto rounded-2xl border-white/10 bg-card/95 p-0 shadow-glow backdrop-blur-xl"
        >
          <Calendar
            mode="single"
            selected={parsed ?? undefined}
            onSelect={(date) => {
              if (date) onChange(formatStoryDateShort(date));
              setOpen(false);
            }}
            locale={ptBR}
            className="rounded-2xl"
          />
        </PopoverContent>
      </Popover>
      <Input
        placeholder="Ou digite: 12 Jun 2023"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-white/5 bg-white/5 text-sm"
      />
    </div>
  );
}

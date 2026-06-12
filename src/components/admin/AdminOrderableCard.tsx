import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function AdminOrderHint({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-muted-foreground">
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function AdminOrderHeader({
  position,
  total,
  title,
  subtitle,
  onMoveUp,
  onMoveDown,
}: {
  position: number;
  total: number;
  title: string;
  subtitle?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
          {position}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          {subtitle && (
            <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={position <= 1}
          onClick={onMoveUp}
          className="h-8 w-8 rounded-lg"
          aria-label="Mover para cima"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={position >= total}
          onClick={onMoveDown}
          className="h-8 w-8 rounded-lg"
          aria-label="Mover para baixo"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function AdminOrderActions({
  onSave,
  onRemove,
  saving = false,
  saveLabel = "Salvar",
  position,
  total,
  onMoveUp,
  onMoveDown,
}: {
  onSave: () => void;
  onRemove: () => void;
  saving?: boolean;
  saveLabel?: string;
  position?: number;
  total?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const canReorder = position !== undefined && total !== undefined && onMoveUp && onMoveDown;

  return (
    <div className="mt-auto space-y-2 border-t border-white/5 pt-2">
      {canReorder && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-2 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Ordem no site
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={position <= 1}
              onClick={onMoveUp}
              className="h-8 w-8 rounded-lg"
              aria-label="Mover para cima"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className="min-w-[3.5rem] text-center text-sm font-medium tabular-nums">
              {position} / {total}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={position >= total}
              onClick={onMoveDown}
              className="h-8 w-8 rounded-lg"
              aria-label="Mover para baixo"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={saving} size="sm" className="rounded-lg px-4">
            <Save className="h-4 w-4" />
            {saving ? "..." : saveLabel}
          </Button>
          <Button
            onClick={onRemove}
            size="sm"
            variant="ghost"
            className="rounded-lg text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {position !== undefined && !canReorder && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Ordem: <span className="text-foreground">{position}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function AdminOrderableGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">{children}</div>
  );
}

export function AdminOrderableShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass flex h-full flex-col gap-4 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

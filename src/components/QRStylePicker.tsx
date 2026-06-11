
import QRStyleIcon from "@/components/QRStyleIcon";
import { Label } from "@/components/ui/label";
import type { CornerDotType, CornerSquareType, DotType } from "@/lib/qr-styles";
import { cn } from "@/lib/utils";

type QRStyleByCategory = {
  dot: DotType;
  cornerSquare: CornerSquareType;
  cornerDot: CornerDotType;
};

type QRStylePickerProps<C extends keyof QRStyleByCategory> = {
  title: string;
  category: C;
  options: { value: QRStyleByCategory[C]; label: string }[];
  value: QRStyleByCategory[C];
  onChange: (value: QRStyleByCategory[C]) => void;
};

function QRStylePicker<C extends keyof QRStyleByCategory>({
  title,
  category,
  options,
  value,
  onChange,
}: QRStylePickerProps<C>) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
        {title}
      </Label>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center p-2 rounded-lg border bg-background hover:bg-secondary/60 transition-colors cursor-pointer",
              value === option.value
                ? "border-primary ring-2 ring-primary/30"
                : "border-border/50",
            )}
          >
            <QRStyleIcon category={category} style={option.value} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default QRStylePicker;

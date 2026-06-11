
import QRStyleIcon from "@/components/QRStyleIcon";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StyleOption<T extends string> = {
  value: T;
  label: string;
};

type QRStylePickerProps<T extends string> = {
  title: string;
  category: "dot" | "cornerSquare" | "cornerDot";
  options: StyleOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

function QRStylePicker<T extends string>({
  title,
  category,
  options,
  value,
  onChange,
}: QRStylePickerProps<T>) {
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

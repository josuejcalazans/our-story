import { STORY_ICON_OPTIONS, StoryIcon } from "@/lib/story-icons";
import { cn } from "@/lib/utils";

export default function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STORY_ICON_OPTIONS.map((opt) => (
        <button
          key={opt.name}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.name)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-all cursor-pointer",
            value === opt.name
              ? "border-primary bg-primary/20 text-primary shadow-glow"
              : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground",
          )}
        >
          <StoryIcon name={opt.name} className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

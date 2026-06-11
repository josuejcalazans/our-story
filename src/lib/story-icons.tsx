import {
  Camera,
  Clapperboard,
  Flower2,
  Heart,
  Home,
  Mail,
  MapPin,
  Music,
  Plane,
  Pizza,
  Smile,
  Sparkles,
  Star,
  Sunrise,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const STORY_ICON_OPTIONS = [
  { name: "Heart", label: "Coração" },
  { name: "Camera", label: "Câmera" },
  { name: "Plane", label: "Viagem" },
  { name: "Pizza", label: "Pizza" },
  { name: "Clapperboard", label: "Filme" },
  { name: "Smile", label: "Risada" },
  { name: "MapPin", label: "Lugar" },
  { name: "Mail", label: "Carta" },
  { name: "Star", label: "Estrela" },
  { name: "Music", label: "Música" },
  { name: "Flower2", label: "Flor" },
  { name: "Sparkles", label: "Brilho" },
  { name: "Home", label: "Casa" },
  { name: "Sunrise", label: "Pôr do sol" },
  { name: "Utensils", label: "Restaurante" },
] as const;

export type StoryIconName = (typeof STORY_ICON_OPTIONS)[number]["name"];

const ICON_MAP: Record<StoryIconName, LucideIcon> = {
  Heart,
  Camera,
  Plane,
  Pizza,
  Clapperboard,
  Smile,
  MapPin,
  Mail,
  Star,
  Music,
  Flower2,
  Sparkles,
  Home,
  Sunrise,
  Utensils,
};

export function isStoryIconName(value: string | null | undefined): value is StoryIconName {
  return Boolean(value && value in ICON_MAP);
}

export function StoryIcon({
  name,
  emoji,
  className,
  filled,
}: {
  name?: string | null;
  emoji?: string | null;
  className?: string;
  filled?: boolean;
}) {
  if (name && isStoryIconName(name)) {
    const Icon = ICON_MAP[name];
    return (
      <Icon
        className={cn(className, filled && name === "Heart" && "fill-current")}
        aria-hidden
      />
    );
  }
  if (emoji) return <span className={cn("leading-none", className)}>{emoji}</span>;
  return <Heart className={cn(className, filled && "fill-current")} aria-hidden />;
}

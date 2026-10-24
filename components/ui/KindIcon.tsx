import {
  Droplets,
  Globe2,
  Landmark,
  MapPin,
  Mountain,
  MountainSnow,
  Sailboat,
  Sun,
  TreePalm,
  WavesHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { QuizTheme } from "@/lib/types";

/** Pictogramme de chaque thème, et de l'option « Tout ». */
export const KIND_ICONS: Record<QuizTheme | "all", LucideIcon> = {
  country: MapPin,
  capital: Landmark,
  river: WavesHorizontal,
  lake: Droplets,
  peak: MountainSnow,
  range: Mountain,
  desert: Sun,
  sea: Sailboat,
  island: TreePalm,
  all: Globe2,
};

export function KindIcon({ kind, size = 20, className }: { kind: QuizTheme | "all"; size?: number; className?: string }) {
  const Icon = KIND_ICONS[kind];
  return <Icon size={size} className={className} />;
}

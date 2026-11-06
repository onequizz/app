"use client";

import clsx from "clsx";
import { BookMarked, CalendarDays, Crosshair, Timer, type LucideIcon } from "lucide-react";
import { reviewPool } from "@/lib/game/engine";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SessionMode } from "@/lib/types";
import { useStats } from "@/store/stats";
import { useHydrated } from "@/store/useHydrated";

const MODES: { mode: SessionMode; icon: LucideIcon }[] = [
  { mode: "classic", icon: Crosshair },
  { mode: "timeAttack", icon: Timer },
  { mode: "daily", icon: CalendarDays },
  { mode: "review", icon: BookMarked },
];

/** Les thèmes choisis ne comptent que dans ces modes (défi du jour et révision imposent leurs cibles). */
export const modeUsesThemes = (mode: SessionMode) => mode === "classic" || mode === "timeAttack";

/** Choix du mode de jeu : Classique, Contre-la-montre, Défi du jour, Révision. */
export function ModePicker({ value, onChange }: { value: SessionMode; onChange: (mode: SessionMode) => void }) {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const targets = useStats((s) => s.targets);
  const reviewEmpty = hydrated && reviewPool(targets).length === 0;

  return (
    <div role="radiogroup" aria-label={t("settings.gameMode")} className="grid grid-cols-2 gap-2">
      {MODES.map(({ mode, icon: Icon }) => {
        const selected = value === mode;
        const disabled = mode === "review" && reviewEmpty && !selected;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            title={disabled ? t("mode.review.empty") : undefined}
            onClick={() => onChange(mode)}
            className={clsx(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm font-semibold transition disabled:opacity-45",
              selected
                ? "border-accent bg-accent/12 text-ink"
                : "border-line text-muted hover:border-accent/50 hover:text-ink",
            )}
          >
            <Icon size={16} className={clsx("shrink-0", selected && "text-accent")} />
            <span className="truncate">{t(`mode.${mode}.title`)}</span>
          </button>
        );
      })}
    </div>
  );
}

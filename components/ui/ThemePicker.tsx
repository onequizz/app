"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { KindIcon } from "@/components/ui/KindIcon";
import { targetPool } from "@/lib/data/countries";
import { QUIZ_THEMES } from "@/lib/data/features";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { QuizTheme, Zone } from "@/lib/types";
import { useSettings } from "@/store/settings";

interface TileProps {
  theme: QuizTheme | "all";
  selected: boolean;
  count: number;
  disabled?: boolean;
  onClick: () => void;
}

function Tile({ theme, selected, count, disabled, onClick }: TileProps) {
  const { t, n } = useI18n();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "group relative flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-start transition disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-accent",
        selected
          ? "border-accent bg-accent/12 shadow-sm shadow-accent/10"
          : "border-line bg-surface-solid hover:border-accent/50",
        theme === "all" && "col-span-2",
      )}
    >
      <span
        className={clsx(
          "grid size-8 shrink-0 place-items-center rounded-xl transition",
          selected ? "bg-accent text-accent-ink" : "bg-accent/12 text-accent",
        )}
      >
        <KindIcon kind={theme} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight font-bold">{t(`quiz.${theme}`)}</span>
        <span className="tabular block text-[11px] font-bold text-muted">
          {t("home.targetsInPlay", { n: n(count) })}
        </span>
      </span>
      <span
        aria-hidden
        className={clsx(
          "grid size-5 shrink-0 place-items-center rounded-full border transition",
          selected ? "border-accent bg-accent text-accent-ink" : "border-line text-transparent",
        )}
      >
        <Check size={13} strokeWidth={3} />
      </span>
    </button>
  );
}

/** Choix des thèmes d'une partie : un, plusieurs, ou « Tout ». */
export function ThemePicker({
  zone,
  disabled = false,
  hint = true,
}: {
  zone: Zone;
  disabled?: boolean;
  /** Rappel « au moins un thème » sous la grille quand rien n'est coché. */
  hint?: boolean;
}) {
  const { t } = useI18n();
  const themes = useSettings((s) => s.themes);
  const toggleTheme = useSettings((s) => s.toggleTheme);
  const toggleAllThemes = useSettings((s) => s.toggleAllThemes);
  const all = themes.length === QUIZ_THEMES.length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {QUIZ_THEMES.map((theme) => (
          <Tile
            key={theme}
            theme={theme}
            disabled={disabled}
            selected={themes.includes(theme)}
            count={targetPool(zone, [theme]).length}
            onClick={() => toggleTheme(theme)}
          />
        ))}
        <Tile
          theme="all"
          disabled={disabled}
          selected={all}
          count={targetPool(zone, QUIZ_THEMES).length}
          onClick={toggleAllThemes}
        />
      </div>
      {hint && themes.length === 0 && !disabled && <p className="mt-2 text-xs text-muted">{t("settings.atLeastOne")}</p>}
    </div>
  );
}

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
  large: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function Tile({ theme, selected, count, large, disabled, onClick }: TileProps) {
  const { t, n } = useI18n();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "group relative flex items-start gap-3 rounded-2xl border text-start transition disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-accent",
        large ? "p-4 hover:-translate-y-0.5 hover:shadow-lg" : "px-3 py-2.5",
        selected
          ? "border-accent bg-accent/12 shadow-sm shadow-accent/10"
          : "border-line bg-surface-solid hover:border-accent/50",
        theme === "all" && large && "sm:col-span-2 lg:col-span-3",
      )}
    >
      <span
        className={clsx(
          "grid shrink-0 place-items-center rounded-xl transition",
          large ? "size-11" : "size-8",
          selected ? "bg-accent text-accent-ink" : "bg-accent/12 text-accent",
        )}
      >
        <KindIcon kind={theme} size={large ? 22 : 16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={clsx("block leading-tight font-bold", large ? "font-display text-base" : "text-sm")}>
          {t(`quiz.${theme}`)}
        </span>
        {large && <span className="mt-0.5 block text-xs text-muted">{t(`quiz.${theme}.desc`)}</span>}
        <span className={clsx("tabular block text-[11px] font-bold", large ? "mt-1.5 text-accent" : "text-muted")}>
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
  large = false,
  disabled = false,
}: {
  zone: Zone;
  large?: boolean;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const themes = useSettings((s) => s.themes);
  const toggleTheme = useSettings((s) => s.toggleTheme);
  const toggleAllThemes = useSettings((s) => s.toggleAllThemes);
  const all = themes.length === QUIZ_THEMES.length;

  return (
    <div>
      <div className={clsx("grid gap-2", large ? "gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2")}>
        {QUIZ_THEMES.map((theme) => (
          <Tile
            key={theme}
            theme={theme}
            large={large}
            disabled={disabled}
            selected={themes.includes(theme)}
            count={targetPool(zone, [theme]).length}
            onClick={() => toggleTheme(theme)}
          />
        ))}
        <Tile
          theme="all"
          large={large}
          disabled={disabled}
          selected={all}
          count={targetPool(zone, QUIZ_THEMES).length}
          onClick={toggleAllThemes}
        />
      </div>
      {themes.length === 1 && !disabled && <p className="mt-2 text-xs text-muted">{t("settings.atLeastOne")}</p>}
    </div>
  );
}

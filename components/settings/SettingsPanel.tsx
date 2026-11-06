"use client";

import { Info, RotateCcw } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button, Field, Segmented, Toggle } from "@/components/ui/controls";
import { ThemePicker } from "@/components/ui/ThemePicker";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SessionMode } from "@/lib/types";
import { useSettings, type Theme } from "@/store/settings";
import { ModePicker } from "./ModePicker";
import { RulesFields } from "./RulesFields";

export function SettingsPanel({
  open,
  onClose,
  rulesLocked = false,
  onApply,
  canApply = false,
  mode,
  onModeChange,
}: {
  open: boolean;
  onClose: () => void;
  /** Règles verrouillées (défi du jour). */
  rulesLocked?: boolean;
  /** En partie : relance une partie avec les règles modifiées (bouton « Appliquer »). */
  onApply?: () => void;
  /** Les règles diffèrent de celles de la partie en cours. */
  canApply?: boolean;
  /** En partie : mode choisi, appliqué avec « Appliquer ». */
  mode?: SessionMode;
  onModeChange?: (mode: SessionMode) => void;
}) {
  const { t, locale, setLocale } = useI18n();
  const s = useSettings();
  const withApply = !!onApply;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("settings.title")}
      footer={
        withApply && (
          <Button className="w-full" disabled={!canApply || s.themes.length === 0} onClick={onApply}>
            <RotateCcw size={16} />
            {t("settings.apply")}
          </Button>
        )
      }
    >
      <div className="space-y-7">
        <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-muted">
          <Info size={15} className="mt-px shrink-0" />
          {rulesLocked
            ? t("settings.dailyLocked")
            : withApply
              ? t("settings.appliesOnApply")
              : t("settings.appliesNext")}
        </p>

        {mode && onModeChange && (
          <Field label={t("settings.gameMode")}>
            <ModePicker value={mode} onChange={onModeChange} />
          </Field>
        )}

        <Field label={t("settings.mode")}>
          <ThemePicker zone={s.zone} disabled={rulesLocked} />
        </Field>

        <RulesFields disabled={rulesLocked} mode={mode} />

        <hr className="border-line" />

        <div className="space-y-5">
          <Toggle checked={s.sound} onChange={(v) => s.set("sound", v)} label={t("settings.sound")} />
          <Toggle
            checked={s.hotCold}
            onChange={(v) => s.set("hotCold", v)}
            label={t("settings.hotCold")}
            help={t("settings.hotColdHelp")}
          />
          <Toggle checked={s.globe} onChange={(v) => s.set("globe", v)} label={t("settings.globe")} />
        </div>

        <Field label={t("settings.theme")}>
          <Segmented<Theme>
            value={s.theme}
            onChange={(v) => s.set("theme", v)}
            options={[
              { value: "system", label: t("theme.system") },
              { value: "light", label: t("theme.light") },
              { value: "dark", label: t("theme.dark") },
            ]}
          />
        </Field>

        <Field label={t("settings.language")}>
          <div className="grid grid-cols-2 gap-2">
            {LOCALES.map((l) => (
              <button
                key={l}
                lang={l}
                onClick={() => setLocale(l)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  locale === l
                    ? "border-accent bg-accent/12"
                    : "border-line text-muted hover:border-accent/50 hover:text-ink"
                }`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Drawer>
  );
}

"use client";

import { Info } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Segmented, Slider, Toggle } from "@/components/ui/controls";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TargetMode, Zone } from "@/lib/types";
import { useSettings, type Theme } from "@/store/settings";

const ZONES: Zone[] = ["world", "europe", "africa", "asia", "americas", "oceania"];

export function SettingsPanel({
  open,
  onClose,
  rulesLocked = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Règles verrouillées (défi du jour). */
  rulesLocked?: boolean;
}) {
  const { t, km, locale, setLocale } = useI18n();
  const s = useSettings();

  return (
    <Drawer open={open} onClose={onClose} title={t("settings.title")}>
      <div className="space-y-7">
        <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-muted">
          <Info size={15} className="mt-px shrink-0" />
          {rulesLocked ? t("settings.dailyLocked") : t("settings.appliesNext")}
        </p>

        <Field label={t("settings.mode")}>
          <Segmented<TargetMode>
            value={s.mode}
            onChange={(v) => s.set("mode", v)}
            disabled={rulesLocked}
            options={[
              { value: "country", label: t("settings.mode.country") },
              { value: "capital", label: t("settings.mode.capital") },
              { value: "mixed", label: t("settings.mode.mixed") },
            ]}
          />
        </Field>

        <Field label={t("settings.zone")}>
          <div className="grid grid-cols-2 gap-2">
            {ZONES.map((z) => (
              <button
                key={z}
                disabled={rulesLocked}
                onClick={() => s.set("zone", z)}
                className={`rounded-xl border px-3 py-2.5 text-start text-sm font-semibold transition disabled:opacity-50 ${
                  s.zone === z
                    ? "border-accent bg-accent/12 text-ink"
                    : "border-line text-muted hover:border-accent/50 hover:text-ink"
                }`}
              >
                {t(`zone.${z}`)}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t("settings.attempts")}>
          <Segmented<number>
            value={s.attempts}
            onChange={(v) => s.set("attempts", v)}
            disabled={rulesLocked}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: n }))}
          />
        </Field>

        <Field label={t("settings.tolerance")} help={t("settings.toleranceHelp")}>
          <Slider
            value={s.toleranceKm}
            min={0}
            max={500}
            step={25}
            onChange={(v) => s.set("toleranceKm", v)}
            format={km}
            disabled={rulesLocked}
          />
        </Field>

        <Field label={t("settings.rounds")}>
          <Segmented<number>
            value={s.rounds}
            onChange={(v) => s.set("rounds", v)}
            disabled={rulesLocked}
            options={[5, 10, 15, 20].map((n) => ({ value: n, label: n }))}
          />
        </Field>

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

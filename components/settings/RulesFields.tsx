"use client";

import { TriangleAlert } from "lucide-react";
import { Field, Segmented, Slider } from "@/components/ui/controls";
import { targetPool } from "@/lib/data/countries";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SessionMode, Zone } from "@/lib/types";
import { useSettings } from "@/store/settings";

const ZONES: Zone[] = ["world", "europe", "africa", "asia", "americas", "oceania"];

/** Règles d'une partie : zone, essais, tolérance et nombre de tours. */
export function RulesFields({ disabled = false, mode }: { disabled?: boolean; mode?: SessionMode }) {
  const { t, km } = useI18n();
  const s = useSettings();
  const zoneEmpty = s.themes.length > 0 && targetPool(s.zone, s.themes).length === 0;

  return (
    <>
      <Field label={t("settings.zone")}>
        <div className="grid grid-cols-2 gap-2">
          {ZONES.map((z) => (
            <button
              key={z}
              disabled={disabled}
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
        {zoneEmpty && !disabled && (
          <p className="mt-2 flex items-start gap-2 text-xs text-muted">
            <TriangleAlert size={14} className="mt-px shrink-0 text-accent" />
            {t("settings.zoneEmpty")}
          </p>
        )}
      </Field>

      <Field label={t("settings.attempts")}>
        <Segmented<number>
          value={s.attempts}
          onChange={(v) => s.set("attempts", v)}
          disabled={disabled}
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
          disabled={disabled}
        />
      </Field>

      {/* Contre-la-montre : la partie dure 60 s, sans nombre de tours. */}
      {mode !== "timeAttack" && (
        <Field label={t("settings.rounds")}>
          <Segmented<number>
            value={s.rounds}
            onChange={(v) => s.set("rounds", v)}
            disabled={disabled}
            options={[5, 10, 15, 20].map((n) => ({ value: n, label: n }))}
          />
        </Field>
      )}
    </>
  );
}

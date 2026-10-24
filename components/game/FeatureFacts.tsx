"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { GeoFeature } from "@/lib/types";

/** Mesure clé d'une cible nature : altitude d'un sommet, longueur d'un fleuve, superficie sinon. */
export function useFeatureMeasure(f: GeoFeature): { label: string; value: string } | null {
  const { t, n } = useI18n();
  if (f.elevation) return { label: t("measure.elevation"), value: t("unit.m", { n: n(f.elevation) }) };
  if (f.length) return { label: t("measure.length"), value: t("unit.km", { n: n(f.length) }) };
  if (f.area) return { label: t("measure.area"), value: t("unit.km2", { n: n(f.area) }) };
  return null;
}

export function FeatureMeasure({ feature, inline = false }: { feature: GeoFeature; inline?: boolean }) {
  const m = useFeatureMeasure(feature);
  if (!m) return null;
  return inline ? (
    <>
      <span className="font-normal text-muted">{m.label}</span> {m.value}
    </>
  ) : (
    <>{m.value}</>
  );
}

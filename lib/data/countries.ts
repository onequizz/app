import raw from "@/data/countries.json";
import type { Locale } from "@/lib/i18n/config";
import type { Country, Target, TargetMode, Zone } from "@/lib/types";

export const COUNTRIES = raw as Country[];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string): Country {
  const c = BY_CODE.get(code);
  if (!c) throw new Error(`Pays inconnu : ${code}`);
  return c;
}

export function countriesInZone(zone: Zone): Country[] {
  return zone === "world" ? COUNTRIES : COUNTRIES.filter((c) => c.region === zone);
}

/** Toutes les cibles jouables pour une zone et un mode donnés. */
export function targetPool(zone: Zone, mode: TargetMode): Target[] {
  const pool: Target[] = [];
  for (const c of countriesInZone(zone)) {
    if (mode !== "capital") pool.push({ kind: "country", code: c.code });
    if (mode !== "country" && c.capital) pool.push({ kind: "capital", code: c.code });
  }
  return pool;
}

export function targetKey(t: Target): string {
  return `${t.kind}:${t.code}`;
}

export function parseTargetKey(key: string): Target {
  const [kind, code] = key.split(":");
  return { kind: kind as Target["kind"], code };
}

/** Libellé affiché pour une cible : nom du pays ou de la capitale. */
export function targetLabel(t: Target, locale: Locale): string {
  const c = getCountry(t.code);
  return t.kind === "capital" && c.capital ? c.capital.names[locale] : c.names[locale];
}

/** Emprise d'affichage de chaque zone : [ouest, sud, est, nord]. */
export const ZONE_BOUNDS: Record<Zone, [number, number, number, number]> = {
  world: [-165, -55, 185, 75],
  europe: [-25, 34, 45, 71],
  africa: [-20, -36, 55, 38],
  asia: [25, -11, 150, 56],
  americas: [-168, -56, -30, 72],
  oceania: [110, -48, 190, 8],
};

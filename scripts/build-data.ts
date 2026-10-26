/**
 * Génère les données statiques de OneQuizz :
 *  - data/countries.json  : pays, capitales (coordonnées + noms fr/en/ar/es), population, titres Wikipédia
 *  - public/geo/world.json : frontières (Natural Earth 1:50m) en GeoJSON, propriété `code` = ISO alpha-2
 *
 * Le Sahara Occidental (ISO EH, n° 732) est conservé comme territoire distinct,
 * séparé du Maroc, tel que fourni par Natural Earth.
 *
 * Usage : npm run build:data
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import polygonClipping, { type MultiPolygon as MultiPolygonCoords, type Ring } from "polygon-clipping";
import { feature, merge } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import worldCountries from "world-countries";
import topology from "world-atlas/countries-50m.json" with { type: "json" };

const ROOT = join(import.meta.dirname, "..");
const LANGS = ["fr", "en", "ar", "es"] as const;
type Lang = (typeof LANGS)[number];
type Names = Record<Lang, string>;

/** Territoires non indépendants que l'on garde comme cibles de jeu. */
const EXTRA_CODES = new Set(["EH", "PS", "XK", "TW"]);

/** Entités Natural Earth sans code ISO : rattachement explicite. */
const NAME_TO_CODE: Record<string, string | null> = {
  Somaliland: "SO", // fusionné avec la Somalie
  "N. Cyprus": "CY", // fusionné avec Chypre
  Kosovo: "XK",
  "Indian Ocean Ter.": null,
  "Siachen Glacier": null,
};

/** Corrections manuelles des capitales (coordonnées et/ou noms). */
const CAPITAL_OVERRIDES: Record<string, { lat: number; lng: number; names: Names }> = {
  EH: {
    lat: 27.1536,
    lng: -13.2033,
    names: { fr: "Laâyoune", en: "Laayoune", ar: "العيون", es: "El Aaiún" },
  },
  // Jérusalem-Est (et non Ramallah, siège administratif).
  PS: {
    lat: 31.7833,
    lng: 35.2333,
    names: { fr: "Jérusalem", en: "Jerusalem", ar: "القدس", es: "Jerusalén" },
  },
};

const REGION_MAP: Record<string, string> = {
  Europe: "europe",
  Asia: "asia",
  Africa: "africa",
  Americas: "americas",
  Oceania: "oceania",
};

// ---------------------------------------------------------------------------

const selected = worldCountries.filter(
  (c) => (c.independent || EXTRA_CODES.has(c.cca2)) && REGION_MAP[c.region],
);
const codes = selected.map((c) => c.cca2);

async function sparql<T>(query: string): Promise<T[]> {
  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
      "User-Agent": "OneQuizz-data-builder/0.1 (educational geography game)",
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] };
  };
  return json.results.bindings.map(
    (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])) as T,
  );
}

const values = codes.map((c) => `"${c}"`).join(" ");
const labelClauses = LANGS.map(
  (l) => `OPTIONAL { ?cap rdfs:label ?${l} FILTER(LANG(?${l}) = "${l}") }`,
).join("\n");
const wikiClauses = LANGS.map(
  (l) =>
    `OPTIONAL { ?w_${l} schema:about ?c ; schema:isPartOf <https://${l}.wikipedia.org/> ; schema:name ?wiki_${l} }`,
).join("\n");

type CapitalRow = { iso: string; cap: string; coord: string; rank: string } & Partial<Names>;
type CountryRow = { iso: string; pop?: string } & Partial<Record<`wiki_${Lang}`, string>>;

function parsePoint(wkt: string): { lat: number; lng: number } | null {
  const m = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(wkt);
  return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null;
}

function round(n: number, d = 3) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function roundGeometry(g: Geometry): Geometry {
  const r = (p: Position): Position => [round(p[0]), round(p[1])];
  switch (g.type) {
    case "Polygon":
      return { type: "Polygon", coordinates: g.coordinates.map((ring) => ring.map(r)) };
    case "MultiPolygon":
      return {
        type: "MultiPolygon",
        coordinates: g.coordinates.map((poly) => poly.map((ring) => ring.map(r))),
      };
    default:
      return g;
  }
}

function bboxOf(g: Geometry): [number, number, number, number] {
  let w = 180, s = 90, e = -180, n = -90;
  const visit = (p: Position) => {
    w = Math.min(w, p[0]); e = Math.max(e, p[0]);
    s = Math.min(s, p[1]); n = Math.max(n, p[1]);
  };
  if (g.type === "Polygon") g.coordinates.flat().forEach(visit);
  if (g.type === "MultiPolygon") g.coordinates.flat(2).forEach(visit);
  return [round(w, 2), round(s, 2), round(e, 2), round(n, 2)];
}

/**
 * Dans Natural Earth 4.1, le polygone « Morocco » englobe la partie du Sahara Occidental
 * située à l'ouest du mur de sable, et « W. Sahara » n'en garde que la partie est.
 * On rétablit le territoire complet du Sahara Occidental en découpant le long de sa
 * frontière nord internationalement reconnue : le parallèle 27°40′N.
 */
const WESTERN_SAHARA_NORTH_LAT = 27 + 40 / 60;

function toMulti(g: Geometry): MultiPolygonCoords {
  if (g.type === "Polygon") return [g.coordinates as Ring[]];
  if (g.type === "MultiPolygon") return g.coordinates as Ring[][];
  throw new Error(`Géométrie inattendue : ${g.type}`);
}

function fromMulti(m: MultiPolygonCoords): Geometry {
  return m.length === 1
    ? { type: "Polygon", coordinates: m[0] }
    : { type: "MultiPolygon", coordinates: m };
}

function fixWesternSahara(geometries: Map<string, Geometry>) {
  const ma = geometries.get("MA");
  const eh = geometries.get("EH");
  if (!ma || !eh) throw new Error("Maroc ou Sahara Occidental introuvable");

  const lat = WESTERN_SAHARA_NORTH_LAT;
  const south: Ring[][] = [[[[-30, 0], [10, 0], [10, lat], [-30, lat], [-30, 0]]]];
  const north: Ring[][] = [[[[-30, lat], [10, lat], [10, 60], [-30, 60], [-30, lat]]]];

  const maNorth = polygonClipping.intersection(toMulti(ma), north);
  const maSouth = polygonClipping.intersection(toMulti(ma), south);
  const ehFull = polygonClipping.union(toMulti(eh), maSouth);

  geometries.set("MA", fromMulti(maNorth));
  geometries.set("EH", fromMulti(ehFull));
  console.log(
    `→ Sahara Occidental : ${maSouth.length} partie(s) rattachée(s), ${ehFull.length} polygone(s) final(aux)`,
  );
}

/**
 * topojson-client recolle les arcs situés de part et d'autre de l'antiméridien (Russie, Fidji),
 * et le contour de l'Antarctique fait le tour du pôle sans s'y refermer : des anneaux sautent
 * de +180° à -180°, et MapLibre trace alors des bandes à travers toute la carte.
 * On « déroule » les longitudes de ces anneaux, on ferme par le pôle ceux qui l'entourent,
 * puis on redécoupe proprement à ±180°.
 */
function crossesAntimeridian(r: Ring) {
  return r.some((p, i) => i > 0 && Math.abs(p[0] - r[i - 1][0]) > 180);
}

function unwrapRing(r: Ring): Ring {
  const out: Ring = [r[0]];
  for (let i = 1; i < r.length; i++) {
    let lng = r[i][0];
    const prev = out[i - 1][0];
    while (lng - prev > 180) lng -= 360;
    while (lng - prev < -180) lng += 360;
    out.push([lng, r[i][1]]);
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (Math.abs(last[0] - first[0]) > 180) {
    // L'anneau fait le tour d'un pôle : on le referme en longeant ce pôle.
    const pole = Math.sign(out.reduce((s, p) => s + p[1], 0)) * 90;
    out.push([last[0], pole], [first[0], pole], first);
  }
  return out;
}

function splitAntimeridian(g: Geometry): Geometry {
  const polys = toMulti(g);
  if (!polys.some((p) => p.some(crossesAntimeridian))) return g;
  const unwrapped = polys
    // Anneaux dégénérés (tous les points sur un même parallèle, ex. le pôle Sud) : ignorés.
    .map((p) => p.filter((r) => !r.every((q) => q[1] === r[0][1])).map(unwrapRing))
    .filter((p) => p.length > 0);
  const parts = [-360, 0, 360].map((off) => {
    const window: Ring[][] = [
      [[[-180 + off, -90], [180 + off, -90], [180 + off, 90], [-180 + off, 90], [-180 + off, -90]]],
    ];
    return polygonClipping
      .intersection(unwrapped, window)
      .map((p) => p.map((r) => r.map(([x, y]) => [x - off, y] as [number, number])));
  });
  return fromMulti(polygonClipping.union(parts[0], ...parts.slice(1)));
}

async function main() {
  console.log(`→ ${selected.length} pays/territoires sélectionnés`);

  // --- Géométries -----------------------------------------------------------
  const topo = topology as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const geoms = topo.objects.countries.geometries;
  const byCcn3 = new Map(worldCountries.map((c) => [c.ccn3, c.cca2]));

  const groups = new Map<string, typeof geoms>();
  let anon = 0;
  for (const g of geoms) {
    let code: string | null | undefined =
      g.id !== undefined ? byCcn3.get(String(g.id)) : undefined;
    if (code === undefined) code = NAME_TO_CODE[(g.properties as { name?: string } | undefined)?.name ?? ""];
    const key = code ?? `_${anon++}`;
    groups.set(key, [...(groups.get(key) ?? []), g]);
  }

  const geometries = new Map<string, Geometry>();
  for (const [code, gs] of groups) {
    const geometry =
      gs.length === 1
        ? (feature(topo, gs[0]) as Feature).geometry
        : (merge(topo, gs as never) as Geometry);
    if (geometry) geometries.set(code, geometry);
  }

  fixWesternSahara(geometries);
  for (const [code, geometry] of geometries) geometries.set(code, splitAntimeridian(geometry));

  const features: Feature[] = [];
  const bboxes = new Map<string, [number, number, number, number]>();
  for (const [code, geometry] of geometries) {
    const rounded = roundGeometry(geometry);
    features.push({ type: "Feature", properties: { code }, geometry: rounded });
    if (!code.startsWith("_")) bboxes.set(code, bboxOf(rounded));
  }

  const world: FeatureCollection = { type: "FeatureCollection", features };
  const worldPath = join(ROOT, "public/geo/world.json");
  mkdirSync(dirname(worldPath), { recursive: true });
  writeFileSync(worldPath, JSON.stringify(world));
  console.log(`→ ${features.length} entités géographiques écrites dans public/geo/world.json`);

  // --- Wikidata -------------------------------------------------------------
  console.log("→ Requête Wikidata (capitales)…");
  const capRows = await sparql<CapitalRow>(`
    SELECT ?iso ?cap ?coord ?rank ${LANGS.map((l) => `?${l}`).join(" ")} WHERE {
      VALUES ?iso { ${values} }
      ?c wdt:P297 ?iso .
      ?c p:P36 ?st . ?st ps:P36 ?cap ; wikibase:rank ?rank .
      FILTER(?rank != wikibase:DeprecatedRank)
      FILTER NOT EXISTS { ?st pq:P582 ?end }
      ?cap wdt:P625 ?coord .
      ${labelClauses}
    }`);

  console.log("→ Requête Wikidata (population, Wikipédia)…");
  const countryRows = await sparql<CountryRow>(`
    SELECT ?iso ?pop ${LANGS.map((l) => `?wiki_${l}`).join(" ")} WHERE {
      VALUES ?iso { ${values} }
      ?c wdt:P297 ?iso .
      OPTIONAL { ?c wdt:P1082 ?pop }
      ${wikiClauses}
    }`);

  // --- Assemblage -----------------------------------------------------------
  const missing: string[] = [];
  const countries = selected.map((c) => {
    const names: Names = {
      fr: c.translations.fra?.common ?? c.name.common,
      en: c.name.common,
      ar: c.translations.ara?.common ?? c.name.common,
      es: c.translations.spa?.common ?? c.name.common,
    };

    // Capitale : priorité au rang "preferred", puis au nom correspondant à world-countries.
    const candidates = capRows.filter((r) => r.iso === c.cca2);
    const wanted = (c.capital?.[0] ?? "").toLowerCase();
    candidates.sort((a, b) => {
      const score = (r: CapitalRow) =>
        (r.rank.endsWith("PreferredRank") ? 2 : 0) +
        (r.en?.toLowerCase() === wanted ? 1 : 0);
      return score(b) - score(a);
    });
    let capital: { lat: number; lng: number; names: Names } | null = null;
    const override = CAPITAL_OVERRIDES[c.cca2];
    if (override) {
      capital = override;
    } else if (candidates[0]) {
      const row = candidates[0];
      const pt = parsePoint(row.coord);
      if (pt) {
        const fallback = row.en ?? c.capital?.[0] ?? "";
        capital = {
          lat: round(pt.lat, 4),
          lng: round(pt.lng, 4),
          names: {
            fr: row.fr ?? fallback,
            en: row.en ?? fallback,
            ar: row.ar ?? fallback,
            es: row.es ?? fallback,
          },
        };
      }
    }
    if (!capital) missing.push(c.cca2);

    const rows = countryRows.filter((r) => r.iso === c.cca2);
    const population = Math.max(0, ...rows.map((r) => Number(r.pop ?? 0)));
    const wiki = Object.fromEntries(
      LANGS.map((l) => [l, rows.find((r) => r[`wiki_${l}`])?.[`wiki_${l}`] ?? null]),
    );

    return {
      code: c.cca2,
      region: REGION_MAP[c.region],
      subregion: c.subregion,
      names,
      capital,
      center: [round(c.latlng[0], 2), round(c.latlng[1], 2)] as [number, number],
      area: c.area,
      population: population || null,
      flag: c.flag,
      bbox: bboxes.get(c.cca2) ?? null,
      wiki,
    };
  });

  // Drapeaux SVG locaux (les emojis drapeaux ne s'affichent pas sous Windows).
  const flagsDir = join(ROOT, "public/flags");
  mkdirSync(flagsDir, { recursive: true });
  for (const c of countries) {
    copyFileSync(
      join(ROOT, `node_modules/country-flag-icons/3x2/${c.code}.svg`),
      join(flagsDir, `${c.code}.svg`),
    );
  }

  countries.sort((a, b) => a.names.en.localeCompare(b.names.en));
  writeFileSync(join(ROOT, "data/countries.json"), JSON.stringify(countries, null, 1));
  console.log(`→ ${countries.length} pays écrits dans data/countries.json`);
  if (missing.length) console.warn(`⚠ Capitale introuvable : ${missing.join(", ")}`);
  const noShape = countries.filter((c) => !c.bbox).map((c) => c.code);
  if (noShape.length) console.log(`ℹ Sans polygone à l'échelle 1:50m (point utilisé) : ${noShape.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

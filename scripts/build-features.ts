/**
 * Génère les cibles « nature » de OneQuizz (fleuves, lacs, sommets, chaînes, déserts, mers, îles) :
 *  - data/features.json        : noms fr/en/ar/es, continent, pays traversés, mesures, titres Wikipédia
 *  - public/geo/features.json  : tracés simplifiés (Natural Earth 1:10m), propriété `id` = élément Wikidata
 *
 * La liste des cibles est dans scripts/features-catalog.ts. Les pays et le continent sont déduits
 * de public/geo/world.json et data/countries.json : lancer `npm run build:data` d'abord.
 *
 * Usage : npm run build:features
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon, Position } from "geojson";
import { CATALOG, type CatalogEntry, type FeatureKind } from "./features-catalog";

const ROOT = join(import.meta.dirname, "..");
const LANGS = ["fr", "en", "ar", "es"] as const;
type Lang = (typeof LANGS)[number];
type BBox = [number, number, number, number];

const NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson";

/** Couche Natural Earth où chercher le polygone de chaque type de cible. */
const LAYERS: Partial<Record<FeatureKind, string[]>> = {
  lake: ["ne_10m_lakes", "ne_50m_lakes"],
  range: ["ne_10m_geography_regions_polys", "ne_50m_geography_regions_polys"],
  desert: ["ne_10m_geography_regions_polys", "ne_50m_geography_regions_polys"],
  island: ["ne_10m_geography_regions_polys", "ne_50m_geography_regions_polys"],
  sea: ["ne_10m_geography_marine_polys", "ne_50m_geography_marine_polys"],
};

/** Tolérance de simplification (degrés) : assez fine pour cliquer juste, assez grossière pour rester léger. */
const SIMPLIFY: Record<FeatureKind, number> = {
  river: 0.02,
  lake: 0.01,
  peak: 0,
  range: 0.03,
  desert: 0.03,
  sea: 0.03,
  island: 0.015,
};

// --- Outils géométriques -------------------------------------------------------

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

function sqSegDist(p: Position, a: Position, b: Position) {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = b;
    else if (t > 0) [x, y] = [x + dx * t, y + dy * t];
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

/** Douglas-Peucker. */
function simplifyLine(pts: Position[], tol: number): Position[] {
  if (pts.length <= 2 || tol <= 0) return pts;
  const sq = tol * tol;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let max = sq;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = sqSegDist(pts[i], pts[first], pts[last]);
      if (d > max) {
        max = d;
        index = i;
      }
    }
    if (index > 0) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return pts.filter((_, i) => keep[i]).map((p) => [round(p[0]), round(p[1])]);
}

function simplifyGeometry(g: Geometry, tol: number): Geometry | null {
  switch (g.type) {
    case "Point":
      return { type: "Point", coordinates: [round(g.coordinates[0], 4), round(g.coordinates[1], 4)] };
    case "MultiLineString": {
      const lines = g.coordinates.map((l) => simplifyLine(l, tol)).filter((l) => l.length >= 2);
      return lines.length ? { type: "MultiLineString", coordinates: lines } : null;
    }
    case "MultiPolygon": {
      const polys = g.coordinates
        .map((poly) => poly.map((r) => simplifyLine(r, tol)).filter((r) => r.length >= 4))
        .filter((poly) => poly.length > 0);
      return polys.length ? { type: "MultiPolygon", coordinates: polys } : null;
    }
    default:
      throw new Error(`Géométrie inattendue : ${g.type}`);
  }
}

function positions(g: Geometry): Position[] {
  switch (g.type) {
    case "Point":
      return [g.coordinates];
    case "LineString":
    case "MultiPoint":
      return g.coordinates;
    case "Polygon":
    case "MultiLineString":
      return g.coordinates.flat();
    case "MultiPolygon":
      return g.coordinates.flat(2);
    default:
      return [];
  }
}

function bboxOf(g: Geometry): BBox {
  let w = 180, s = 90, e = -180, n = -90;
  for (const [x, y] of positions(g)) {
    w = Math.min(w, x); e = Math.max(e, x);
    s = Math.min(s, y); n = Math.max(n, y);
  }
  return [round(w, 2), round(s, 2), round(e, 2), round(n, 2)];
}

const intersects = (a: BBox, b: BBox) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

function haversineKm(a: Position, b: Position) {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function toMultiPolygon(geoms: Geometry[]): MultiPolygon {
  const coords: Position[][][] = [];
  for (const g of geoms) {
    if (g.type === "Polygon") coords.push(g.coordinates);
    else if (g.type === "MultiPolygon") coords.push(...g.coordinates);
  }
  return { type: "MultiPolygon", coordinates: coords };
}

function ringArea(r: Position[]) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
}

/** Point d'étiquette : la coordonnée Wikidata si elle tombe sur la cible, sinon un point du tracé. */
function anchorOf(g: Geometry, coord: Position | null): Position {
  if (g.type === "Point") return g.coordinates;
  if (g.type === "MultiPolygon") {
    const feature = { type: "Feature", properties: {}, geometry: g } as Feature<MultiPolygon>;
    if (coord && booleanPointInPolygon(point(coord), feature)) return coord;
    // Plus grand anneau extérieur : barycentre s'il est à l'intérieur, sinon un sommet.
    const outer = g.coordinates.map((p) => p[0]).sort((a, b) => ringArea(b) - ringArea(a))[0];
    const c: Position = [
      outer.reduce((s, p) => s + p[0], 0) / outer.length,
      outer.reduce((s, p) => s + p[1], 0) / outer.length,
    ];
    if (booleanPointInPolygon(point(c), feature)) return [round(c[0]), round(c[1])];
    return outer[Math.floor(outer.length / 2)];
  }
  // Fleuve : sommet au milieu du plus long tronçon.
  const lines = (g as { coordinates: Position[][] }).coordinates;
  const longest = [...lines].sort((a, b) => b.length - a.length)[0];
  return longest[Math.floor(longest.length / 2)];
}

// --- Sources --------------------------------------------------------------------

type Props = Record<string, string | number | null>;
type NeFeature = Feature<Geometry, Props>;

const layerCache = new Map<string, Promise<NeFeature[]>>();

function layer(name: string): Promise<NeFeature[]> {
  if (!layerCache.has(name)) {
    layerCache.set(
      name,
      fetch(`${NE}/${name}.geojson`)
        .then((r) => {
          if (!r.ok) throw new Error(`${name}: ${r.status}`);
          return r.json() as Promise<FeatureCollection<Geometry, Props>>;
        })
        .then((fc) =>
          // Clés en minuscules : les couches régionales de Natural Earth sont en majuscules.
          fc.features.map((f) => ({
            ...f,
            properties: Object.fromEntries(Object.entries(f.properties ?? {}).map(([k, v]) => [k.toLowerCase(), v])),
          })),
        ),
    );
  }
  return layerCache.get(name)!;
}

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
  const json = (await res.json()) as { results: { bindings: Record<string, { value: string }>[] } };
  return json.results.bindings.map(
    (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])) as T,
  );
}

type WikiRow = {
  title: string;
  item: string;
  coord?: string;
  elevation?: string;
  length?: string;
  area?: string;
  /** Codes ISO des pays (P17), séparés par des virgules. */
  isos?: string;
} & Partial<Record<Lang | `wiki_${Lang}`, string>>;

/** Titres Wikipédia canoniques (suit les redirections et normalisations), par titre demandé. */
async function canonicalTitles(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.search = new URLSearchParams({
      action: "query",
      format: "json",
      redirects: "1",
      titles: chunk.join("|"),
    }).toString();
    const res = await fetch(url, { headers: { "User-Agent": "OneQuizz-data-builder/0.1 (educational geography game)" } });
    if (!res.ok) throw new Error(`Wikipédia ${res.status}`);
    const { query } = (await res.json()) as {
      query: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[] };
    };
    const follow = (t: string, list?: { from: string; to: string }[]) => list?.find((x) => x.from === t)?.to ?? t;
    for (const t of chunk) out.set(t, follow(follow(t, query.normalized), query.redirects));
  }
  return out;
}

async function wikidata(requested: string[]): Promise<Map<string, WikiRow>> {
  const canonical = await canonicalTitles(requested);
  const titles = [...new Set(canonical.values())];
  const byTitle = new Map<string, WikiRow>();
  // Par paquets : une seule requête géante dépasse le délai du service.
  for (let i = 0; i < titles.length; i += 60) {
    const chunk = titles.slice(i, i + 60);
    const rows = await sparql<WikiRow>(`
      SELECT ?title ?item
        (SAMPLE(?c) AS ?coord) (MAX(?el) AS ?elevation) (MAX(?len) AS ?length) (MAX(?ar) AS ?area)
        (GROUP_CONCAT(DISTINCT ?iso; separator=",") AS ?isos)
        ${LANGS.map((l) => `(SAMPLE(?l_${l}) AS ?${l}) (SAMPLE(?w_${l}) AS ?wiki_${l})`).join(" ")}
      WHERE {
        VALUES ?title { ${chunk.map((t) => JSON.stringify(t) + "@en").join(" ")} }
        ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?title .
        OPTIONAL { ?item wdt:P625 ?c }
        OPTIONAL { ?item wdt:P17/wdt:P297 ?iso }
        OPTIONAL { ?item p:P2044/psn:P2044/wikibase:quantityAmount ?el }
        OPTIONAL { ?item p:P2043/psn:P2043/wikibase:quantityAmount ?len }
        OPTIONAL { ?item p:P2046/psn:P2046/wikibase:quantityAmount ?ar }
        ${LANGS.map((l) => `OPTIONAL { ?item rdfs:label ?l_${l} FILTER(LANG(?l_${l}) = "${l}") }`).join("\n")}
        ${LANGS.map(
          (l) =>
            `OPTIONAL { ?a_${l} schema:about ?item ; schema:isPartOf <https://${l}.wikipedia.org/> ; schema:name ?w_${l} }`,
        ).join("\n")}
      }
      GROUP BY ?title ?item`);
    for (const r of rows) byTitle.set(r.title, r);
  }
  const out = new Map<string, WikiRow>();
  for (const [t, c] of canonical) {
    const row = byTitle.get(c);
    if (row) out.set(t, row);
  }
  return out;
}

function parsePoint(wkt: string | undefined): Position | null {
  const m = wkt && /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(wkt);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** « mont Everest » → « Mont Everest » (Wikidata met une minuscule en tête des noms communs). */
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

const qid = (uri: string) => uri.slice(uri.lastIndexOf("/") + 1);

// --- Géométrie de chaque cible ----------------------------------------------------

async function riverGeometry(entry: CatalogEntry): Promise<Geometry | null> {
  const names = new Set(entry.ne ?? []);
  const lines: Position[][] = [];
  for (const f of await layer("ne_10m_rivers_lake_centerlines")) {
    if (!names.has(String(f.properties.name))) continue;
    if (entry.within && !intersects(bboxOf(f.geometry), entry.within)) continue;
    if (f.geometry.type === "LineString") lines.push(f.geometry.coordinates);
    else if (f.geometry.type === "MultiLineString") lines.push(...f.geometry.coordinates);
  }
  return lines.length ? { type: "MultiLineString", coordinates: lines } : null;
}

async function polygonGeometry(kind: FeatureKind, entry: CatalogEntry, id: string, labelEn: string) {
  const names = new Set([entry.wiki, labelEn, ...(entry.ne ?? [])].map((s) => s.toLowerCase()));
  for (const name of LAYERS[kind]!) {
    const features = (await layer(name)).filter(
      (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"),
    );
    let matches = features.filter((f) => f.properties.wikidataid === id);
    if (!matches.length) {
      matches = features.filter((f) =>
        [f.properties.name, f.properties.name_en].some((n) => n && names.has(String(n).toLowerCase())),
      );
    }
    if (entry.within) matches = matches.filter((f) => intersects(bboxOf(f.geometry), entry.within!));
    if (matches.length) return toMultiPolygon(matches.map((f) => f.geometry));
  }
  return null;
}

// --- Pays et continent ------------------------------------------------------------

type CountryShape = Feature<Polygon | MultiPolygon, { code: string }> & { bbox: BBox };

function loadCountries() {
  const world = JSON.parse(readFileSync(join(ROOT, "public/geo/world.json"), "utf8")) as FeatureCollection<
    Polygon | MultiPolygon,
    { code: string }
  >;
  const meta = JSON.parse(readFileSync(join(ROOT, "data/countries.json"), "utf8")) as {
    code: string;
    region: string;
  }[];
  const region = new Map(meta.map((c) => [c.code, c.region]));
  const shapes: CountryShape[] = world.features
    .filter((f) => region.has(f.properties.code))
    .map((f) => ({ ...f, bbox: bboxOf(f.geometry) }));
  return { shapes, region };
}

function countryAt(p: Position, shapes: CountryShape[]): string | null {
  for (const s of shapes) {
    if (p[0] < s.bbox[0] || p[0] > s.bbox[2] || p[1] < s.bbox[1] || p[1] > s.bbox[3]) continue;
    if (booleanPointInPolygon(point(p), s)) return s.properties.code;
  }
  return null;
}

function nearestCountry(p: Position, shapes: CountryShape[]): { code: string; km: number } | null {
  let best: { code: string; km: number } | null = null;
  for (const s of shapes) {
    for (const q of positions(s.geometry)) {
      const d = haversineKm(p, q);
      if (!best || d < best.km) best = { code: s.properties.code, km: d };
    }
  }
  return best;
}

/**
 * Pays de la cible : ceux qu'indique Wikidata (un sommet frontalier appartient aux deux pays),
 * complétés par ceux que traverse le tracé. Un pays Wikidata loin du tracé est écarté
 * (le Groenland est rattaché au Danemark, mais cliquer au Danemark ne doit pas compter).
 */
function countriesOf(g: Geometry, wikidataIsos: string[], shapes: CountryShape[]): string[] {
  const traced = tracedCountries(g, shapes);
  const [w, s, e, n] = bboxOf(g);
  const margin = 1;
  const near = (code: string) => {
    const shape = shapes.find((c) => c.properties.code === code);
    return !!shape && intersects(shape.bbox, [w - margin, s - margin, e + margin, n + margin]);
  };
  const declared = wikidataIsos.filter((c) => !traced.includes(c) && near(c));
  return [...traced, ...declared];
}

/** Pays touchés par le tracé : on l'échantillonne et on compte les points tombant dans chaque pays. */
function tracedCountries(g: Geometry, shapes: CountryShape[]): string[] {
  const pts = positions(g);
  const step = Math.max(1, Math.floor(pts.length / 400));
  const counts = new Map<string, number>();
  for (let i = 0; i < pts.length; i += step) {
    const code = countryAt(pts[i], shapes);
    if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()]
    .filter(([, n]) => n / total >= 0.05)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
}

// --- Assemblage -------------------------------------------------------------------

async function main() {
  const { shapes, region } = loadCountries();
  const entries = (Object.entries(CATALOG) as [FeatureKind, CatalogEntry[]][]).flatMap(([kind, list]) =>
    list.map((entry) => ({ kind, entry })),
  );
  console.log(`→ ${entries.length} cibles au catalogue`);

  console.log("→ Requête Wikidata…");
  const rows = await wikidata([...new Set(entries.map((e) => e.entry.wiki))]);

  const meta: unknown[] = [];
  const geo: Feature[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const { kind, entry } of entries) {
    const row = rows.get(entry.wiki);
    if (!row) {
      problems.push(`${kind} « ${entry.wiki} » : introuvable sur Wikipédia (en)`);
      continue;
    }
    const id = qid(row.item);
    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const coord = parsePoint(row.coord);
    const en = row.en ?? entry.wiki;
    let raw: Geometry | null;
    if (kind === "peak") raw = coord && { type: "Point", coordinates: coord };
    else if (kind === "river") raw = await riverGeometry(entry);
    else raw = await polygonGeometry(kind, entry, id, en);

    const geometry = raw && simplifyGeometry(raw, SIMPLIFY[kind]);
    if (!geometry) {
      problems.push(`${kind} « ${entry.wiki} » (${id}) : aucun tracé Natural Earth`);
      continue;
    }

    const bbox = bboxOf(geometry);
    const anchor = anchorOf(geometry, coord);

    // Continent : pays sous le point d'étiquette, sinon le plus proche (mers, îles).
    // Les océans et l'Antarctique ne sont rattachés à aucun continent : ils ne sortent qu'en « Monde entier ».
    const huge = bbox[2] - bbox[0] > 100;
    const here = countryAt(anchor, shapes);
    const near = here ? { code: here, km: 0 } : nearestCountry(anchor, shapes);
    // La Russie compte pour l'Europe dans data/countries.json : à l'est de l'Oural, c'est l'Asie.
    const zone =
      huge || !near || near.km > 1500
        ? null
        : near.code === "RU" && anchor[0] > 60
          ? "asia"
          : region.get(near.code)!;

    const names = Object.fromEntries(
      LANGS.map((l) => [l, entry.names?.[l] ?? (l === "ar" ? (row[l] ?? en) : capitalize(row[l] ?? en))]),
    ) as Record<Lang, string>;
    const num = (v: string | undefined, f = 1) => (v ? Math.round(Number(v) * f) : null);

    meta.push({
      id,
      kind,
      names,
      region: zone,
      anchor: [round(anchor[1], 3), round(anchor[0], 3)],
      bbox,
      countries:
        kind === "sea"
          ? []
          : [
              ...new Set([
                ...countriesOf(geometry, row.isos ? row.isos.split(",") : [], shapes),
                ...(entry.countries ?? []),
              ]),
            ],
      elevation: kind === "peak" ? num(row.elevation) : null,
      length: kind === "river" ? num(row.length, 1 / 1000) : null,
      area: kind === "peak" || kind === "river" ? null : num(row.area, 1 / 1e6),
      wiki: Object.fromEntries(LANGS.map((l) => [l, row[`wiki_${l}`] ?? null])),
    });
    geo.push({ type: "Feature", properties: { id }, geometry });
  }

  writeFileSync(join(ROOT, "data/features.json"), JSON.stringify(meta, null, 1));
  const fc: FeatureCollection = { type: "FeatureCollection", features: geo };
  writeFileSync(join(ROOT, "public/geo/features.json"), JSON.stringify(fc));

  const byKind = Object.fromEntries(
    Object.keys(CATALOG).map((k) => [k, (meta as { kind: string }[]).filter((m) => m.kind === k).length]),
  );
  console.log(`→ ${meta.length} cibles écrites dans data/features.json`, byKind);
  if (problems.length) console.warn(`⚠ ${problems.length} cible(s) ignorée(s) :\n  ${problems.join("\n  ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

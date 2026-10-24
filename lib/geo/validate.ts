import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { multiLineString, point } from "@turf/helpers";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { getCountry } from "@/lib/data/countries";
import { getFeature, isFeatureKind } from "@/lib/data/features";
import { getFeatureShape } from "@/lib/geo/features";
import { haversineKm } from "@/lib/geo/haversine";
import { getShape } from "@/lib/geo/world";
import type { FeatureKind, LngLat, Target } from "@/lib/types";

export interface Evaluation {
  correct: boolean;
  /** 0 si le clic est à l'intérieur du pays. */
  distanceKm: number;
  /** Point de la cible le plus proche du clic. */
  nearest: LngLat;
}

/**
 * Rayon minimal accordé aux très petits pays (Vatican, Monaco, Nauru…),
 * impossibles à viser précisément à l'échelle d'un continent.
 */
export function smallCountryRadiusKm(areaKm2: number): number {
  if (areaKm2 < 2_000) return 80;
  if (areaKm2 < 30_000) return 30;
  return 0;
}

/**
 * Rayon minimal autour des cibles nature : un sommet est un point, un fleuve une ligne,
 * et un petit lac ou une petite île se visent mal à l'échelle d'un continent.
 */
export function featureRadiusKm(kind: FeatureKind, bbox: [number, number, number, number]): number {
  if (kind === "peak") return 60;
  if (kind === "river") return 30;
  const diagonal = haversineKm({ lng: bbox[0], lat: bbox[1] }, { lng: bbox[2], lat: bbox[3] });
  if (diagonal < 60) return 40;
  if (diagonal < 200) return 20;
  return 0;
}

export function evaluateGuess(target: Target, click: LngLat, toleranceKm: number): Evaluation {
  if (isFeatureKind(target.kind)) return evaluateFeature(target.code, click, toleranceKm);
  const country = getCountry(target.code);

  if (target.kind === "capital" && country.capital) {
    // Cliquer dans le pays de la capitale suffit ; la distance à la capitale module le score.
    const cap = { lng: country.capital.lng, lat: country.capital.lat };
    const d = haversineKm(click, cap);
    const correct = d <= toleranceKm || evaluateCountry(target.code, click, toleranceKm).correct;
    return { correct, distanceKm: d, nearest: cap };
  }

  return evaluateCountry(target.code, click, toleranceKm);
}

/** Distance au contour le plus proche (anneaux d'un polygone ou tronçons d'un fleuve). */
function nearestOnLines(lines: Position[][], click: LngLat): Evaluation {
  const snapped = nearestPointOnLine(multiLineString(lines), point([click.lng, click.lat]), { units: "kilometers" });
  const [lng, lat] = snapped.geometry.coordinates;
  return { correct: false, distanceKm: snapped.properties.pointDistance, nearest: { lng, lat } };
}

/** Le clic tombe dans le polygone de ce pays. */
function insideCountry(code: string, click: LngLat): boolean {
  const shape = getShape(code);
  return !!shape && booleanPointInPolygon(point([click.lng, click.lat]), shape);
}

/**
 * Cible nature : cliquer dans l'un de ses pays suffit (sauf mers et océans, qui n'en ont pas) ;
 * sinon il faut viser la cible elle-même, à la tolérance près. La distance à la cible module le score.
 */
function evaluateFeature(id: string, click: LngLat, toleranceKm: number): Evaluation {
  const feature = getFeature(id);
  const inCountry = feature.countries.some((code) => insideCountry(code, click));
  const radius = Math.max(toleranceKm, featureRadiusKm(feature.kind, feature.bbox));
  const geometry = getFeatureShape(id)?.geometry;

  let ev: Evaluation;
  if (!geometry || geometry.type === "Point") {
    const [lng, lat] = geometry?.type === "Point" ? geometry.coordinates : [feature.anchor[1], feature.anchor[0]];
    const nearest = { lng, lat };
    ev = { correct: false, distanceKm: haversineKm(click, nearest), nearest };
  } else if (geometry.type === "MultiLineString" || geometry.type === "LineString") {
    ev = nearestOnLines(geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates, click);
  } else if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    const shape = { type: "Feature", properties: {}, geometry } as Feature<Polygon | MultiPolygon>;
    if (booleanPointInPolygon(point([click.lng, click.lat]), shape)) {
      return { correct: true, distanceKm: 0, nearest: click };
    }
    ev = nearestOnLines(geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat(), click);
  } else {
    throw new Error(`Géométrie inattendue : ${geometry.type}`);
  }
  return { ...ev, correct: inCountry || ev.distanceKm <= radius };
}

function evaluateCountry(code: string, click: LngLat, toleranceKm: number): Evaluation {
  const country = getCountry(code);
  const radius = Math.max(toleranceKm, smallCountryRadiusKm(country.area));
  const shape = getShape(code);

  if (!shape) {
    // Pas de polygone (ex. Tuvalu) : on se rabat sur le centre du pays.
    const center = { lat: country.center[0], lng: country.center[1] };
    const d = haversineKm(click, center);
    return { correct: d <= Math.max(radius, 80), distanceKm: d, nearest: center };
  }

  const pt = point([click.lng, click.lat]);
  if (booleanPointInPolygon(pt, shape)) {
    return { correct: true, distanceKm: 0, nearest: click };
  }

  const rings =
    shape.geometry.type === "Polygon"
      ? shape.geometry.coordinates
      : shape.geometry.coordinates.flat();
  const snapped = nearestPointOnLine(multiLineString(rings), pt, { units: "kilometers" });
  const [lng, lat] = snapped.geometry.coordinates;
  const d = snapped.properties.pointDistance;
  return { correct: d <= radius, distanceKm: d, nearest: { lng, lat } };
}

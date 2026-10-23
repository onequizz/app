import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { multiLineString, point } from "@turf/helpers";
import { getCountry } from "@/lib/data/countries";
import { haversineKm } from "@/lib/geo/haversine";
import { getShape } from "@/lib/geo/world";
import type { LngLat, Target } from "@/lib/types";

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

export function evaluateGuess(target: Target, click: LngLat, toleranceKm: number): Evaluation {
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

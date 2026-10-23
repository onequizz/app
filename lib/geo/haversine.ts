import type { LngLat } from "@/lib/types";

export const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Distance orthodromique (formule de Haversine) en kilomètres. */
export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Points intermédiaires d'un grand cercle entre a et b, avec longitudes « déroulées »
 * pour que la ligne ne saute pas d'un bord à l'autre de la carte à l'antiméridien.
 */
export function greatCirclePoints(a: LngLat, b: LngLat, steps = 64): [number, number][] {
  const φ1 = toRad(a.lat), λ1 = toRad(a.lng);
  const φ2 = toRad(b.lat), λ2 = toRad(b.lng);
  const d = haversineKm(a, b) / EARTH_RADIUS_KM;
  if (d < 1e-6) return [[a.lng, a.lat], [b.lng, b.lat]];

  const points: [number, number][] = [];
  let prevLng = a.lng;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    let lng = toDeg(Math.atan2(y, x));
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    while (lng - prevLng > 180) lng -= 360;
    while (lng - prevLng < -180) lng += 360;
    prevLng = lng;
    points.push([lng, lat]);
  }
  return points;
}

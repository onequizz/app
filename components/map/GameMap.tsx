"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  LngLatBounds,
  Map as MlMap,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
  type StyleSpecification,
} from "maplibre-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCountry, ZONE_BOUNDS } from "@/lib/data/countries";
import { HEAT_COLORS, heatOf } from "@/lib/game/engine";
import { greatCirclePoints } from "@/lib/geo/haversine";
import { smallCountryRadiusKm } from "@/lib/geo/validate";
import { loadWorld, type WorldData } from "@/lib/geo/world";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Guess, LngLat, RoundStatus, Target, Zone } from "@/lib/types";

export interface GameMapProps {
  zone: Zone;
  globe: boolean;
  /** Clics acceptés (phase de devinette). */
  interactive: boolean;
  /** Incrémenté à chaque nouveau tour : recadre sur la zone. */
  roundKey: number;
  target: Target | null;
  roundStatus: RoundStatus;
  guesses: Guess[];
  hotCold: boolean;
  /** Nom de la cible, affiché à la révélation. */
  targetName: string;
  onPick: (p: LngLat) => void;
}

type Palette = Record<
  "ocean" | "land" | "landHover" | "border" | "graticule" | "success" | "reveal" | "danger",
  string
>;

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return {
    ocean: v("--map-ocean"),
    land: v("--map-land"),
    landHover: v("--map-land-hover"),
    border: v("--map-border"),
    graticule: v("--map-graticule"),
    success: v("--success"),
    reveal: v("--reveal"),
    danger: v("--danger"),
  };
}

function graticule(step = 15): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  for (let lng = -180; lng <= 180; lng += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: Array.from({ length: 33 }, (_, i) => [lng, -80 + i * 5]) },
    });
  }
  for (let lat = -75; lat <= 75; lat += step) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]) },
    });
  }
  return { type: "FeatureCollection", features };
}

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

// Worker servi depuis public/ (copié par scripts/copy-maplibre-worker.mjs).
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

function buildStyle(world: WorldData, p: Palette): StyleSpecification {
  return {
    version: 8,
    sources: {
      countries: { type: "geojson", data: world, promoteId: "code" },
      graticule: { type: "geojson", data: graticule() },
      lines: { type: "geojson", data: EMPTY_FC },
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": p.ocean } },
      {
        id: "graticule",
        type: "line",
        source: "graticule",
        paint: { "line-color": p.graticule, "line-width": 1 },
      },
      {
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: fillPaint(p),
      },
      {
        id: "countries-line",
        type: "line",
        source: "countries",
        paint: {
          "line-color": p.border,
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 4, 0.9, 7, 1.5],
        },
      },
      {
        id: "target-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "code"], ""],
        paint: { "line-color": p.reveal, "line-width": 2.5 },
      },
      {
        id: "error-lines",
        type: "line",
        source: "lines",
        layout: { "line-cap": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2.2,
          "line-dasharray": [1.5, 1.5],
        },
      },
    ],
  };
}

function fillPaint(p: Palette) {
  return {
    "fill-color": [
      "case",
      ["boolean", ["feature-state", "success"], false],
      p.success,
      ["boolean", ["feature-state", "reveal"], false],
      p.reveal,
      ["boolean", ["feature-state", "hover"], false],
      p.landHover,
      p.land,
    ],
    "fill-opacity": [
      "case",
      ["any", ["boolean", ["feature-state", "success"], false], ["boolean", ["feature-state", "reveal"], false]],
      0.85,
      1,
    ],
  } as never;
}

function markerEl(color: string, label?: string, variant: "guess" | "target" = "guess", pulse = false) {
  const el = document.createElement("div");
  el.className = `oq-marker oq-marker--${variant}`;
  el.style.setProperty("--c", color);
  if (pulse) el.insertAdjacentHTML("beforeend", '<span class="oq-marker__pulse"></span>');
  el.insertAdjacentHTML("beforeend", '<span class="oq-marker__dot"></span>');
  if (label) {
    const l = document.createElement("span");
    l.className = "oq-marker__label";
    l.textContent = label;
    el.appendChild(l);
  }
  return el;
}

export default function GameMap(props: GameMapProps) {
  const { t, km } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const hovered = useRef<string | null>(null);
  const stateful = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  // Valeurs lues par les gestionnaires d'événements MapLibre.
  const live = useRef(props);
  useEffect(() => {
    live.current = props;
  });

  // --- Création de la carte -------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;

    loadWorld()
      .then((world) => {
        if (cancelled || !container.current) return;
        const palette = readPalette();
        map = new MlMap({
          container: container.current,
          style: buildStyle(world, palette),
          bounds: ZONE_BOUNDS[live.current.zone],
          fitBoundsOptions: { padding: 40 },
          attributionControl: { compact: true, customAttribution: "Natural Earth" },
          dragRotate: false,
          pitchWithRotate: false,
          maxZoom: 9,
        });
        map.touchZoomRotate.disableRotation();
        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) return;
          map!.setProjection({ type: live.current.globe ? "globe" : "mercator" });
          // Crédit replié (bouton ⓘ) : déplié, il masquait les étiquettes de la carte sur mobile.
          map!.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
          setReady(true);
        });

        map.on("click", (e) => {
          if (!live.current.interactive) return;
          const p = e.lngLat.wrap();
          live.current.onPick({ lng: p.lng, lat: p.lat });
        });

        map.on("mousemove", "countries-fill", (e) => {
          const { interactive, target } = live.current;
          const code = (e.features?.[0]?.properties?.code as string | undefined) ?? null;
          const enabled = interactive && target !== null;
          const next = enabled && code && !code.startsWith("_") ? code : null;
          if (next === hovered.current) return;
          if (hovered.current) map!.setFeatureState({ source: "countries", id: hovered.current }, { hover: false });
          if (next) map!.setFeatureState({ source: "countries", id: next }, { hover: true });
          hovered.current = next;
        });
        map.on("mouseleave", "countries-fill", () => {
          if (hovered.current) map!.setFeatureState({ source: "countries", id: hovered.current }, { hover: false });
          hovered.current = null;
        });
      })
      .catch(() => !cancelled && setError(true));

    // Changement de thème : on relit les couleurs CSS.
    const observer = new MutationObserver(() => {
      const m = mapRef.current;
      if (!m || !m.isStyleLoaded()) return;
      const p = readPalette();
      m.setPaintProperty("ocean", "background-color", p.ocean);
      m.setPaintProperty("graticule", "line-color", p.graticule);
      m.setPaintProperty("countries-line", "line-color", p.border);
      const fp = fillPaint(p) as Record<string, unknown>;
      m.setPaintProperty("countries-fill", "fill-color", fp["fill-color"] as never);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelled = true;
      observer.disconnect();
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Projection globe / plane ----------------------------------------------
  useEffect(() => {
    if (ready) mapRef.current?.setProjection({ type: props.globe ? "globe" : "mercator" });
  }, [ready, props.globe]);

  // --- Nouveau tour : recadrage sur la zone ------------------------------------
  useEffect(() => {
    if (!ready) return;
    mapRef.current?.fitBounds(ZONE_BOUNDS[props.zone], { padding: 40, duration: 900 });
  }, [ready, props.roundKey, props.zone]);

  // --- Marqueurs, lignes d'erreur et révélation --------------------------------
  const { guesses, roundStatus, target, hotCold, targetName } = props;
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const palette = readPalette();

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    const lineFeatures: Feature<LineString>[] = [];
    guesses.forEach((g) => {
      const color = g.correct
        ? palette.success
        : hotCold
          ? HEAT_COLORS[heatOf(g.distanceKm)]
          : palette.danger;
      const label = g.correct ? (g.distanceKm > 0 ? km(g.distanceKm) : "✓") : km(g.distanceKm);
      markers.current.push(new Marker({ element: markerEl(color, label) }).setLngLat([g.lng, g.lat]).addTo(map));
      // Les lignes vers la cible la dévoilent : seulement une fois le tour terminé.
      if (roundStatus !== "playing" && (!g.correct || g.distanceKm > 0)) {
        lineFeatures.push({
          type: "Feature",
          properties: { color },
          geometry: { type: "LineString", coordinates: greatCirclePoints(g, g.nearest) },
        });
      }
    });
    (map.getSource("lines") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: lineFeatures,
    });

    // Réinitialise la mise en évidence du tour précédent.
    if (stateful.current) {
      map.setFeatureState({ source: "countries", id: stateful.current }, { reveal: false, success: false });
      stateful.current = null;
    }
    map.setFilter("target-outline", ["==", ["get", "code"], ""]);

    if (!target || roundStatus === "playing") return;

    const won = roundStatus === "won";
    const color = won ? palette.success : palette.reveal;
    const country = getCountry(target.code);

    map.setFeatureState({ source: "countries", id: target.code }, won ? { success: true } : { reveal: true });
    stateful.current = target.code;
    map.setFilter("target-outline", ["==", ["get", "code"], target.code]);
    map.setPaintProperty("target-outline", "line-color", color);

    // Point de la cible : capitale, ou centre du pays (avec repère pour les petits pays).
    let anchor: [number, number] | null = null;
    if (target.kind === "capital" && country.capital) {
      anchor = [country.capital.lng, country.capital.lat];
    } else if (!country.bbox || smallCountryRadiusKm(country.area) > 0 || !won) {
      anchor = [country.center[1], country.center[0]];
    }
    if (anchor) {
      markers.current.push(
        new Marker({ element: markerEl(color, targetName, "target", true) }).setLngLat(anchor).addTo(map),
      );
    }

    // Cadrage : la cible et les essais.
    const focus = new LngLatBounds();
    if (target.kind === "country" && country.bbox) {
      focus.extend([country.bbox[0], country.bbox[1]]);
      focus.extend([country.bbox[2], country.bbox[3]]);
    }
    if (anchor) focus.extend(anchor);
    const bounds = focus.isEmpty() ? new LngLatBounds() : new LngLatBounds(focus.getSouthWest(), focus.getNorthEast());
    guesses.forEach((g) => bounds.extend([g.lng, g.lat]));

    const options = { padding: { top: 120, bottom: 260, left: 60, right: 60 }, maxZoom: 5.5, duration: 1200 };
    // En Mercator, la carte ne dézoome pas au-delà du monde entier en hauteur : sur un écran en
    // portrait, une cible et des essais très éloignés ne tiennent pas ensemble. On centre alors la cible.
    const minZoom = Math.log2(map.getContainer().clientHeight / 512);
    const camera = map.cameraForBounds(bounds, options);
    const fits = live.current.globe || !camera?.zoom || camera.zoom >= minZoom;
    if (fits || focus.isEmpty()) map.fitBounds(bounds, options);
    else map.fitBounds(focus, { ...options, maxZoom: 3.5 });
  }, [ready, guesses, roundStatus, target, hotCold, targetName, km]);

  return (
    <div className="absolute inset-0">
      {/* Taille via h-full/w-full : `.maplibregl-map` impose position: relative, qui annule `absolute inset-0`. */}
      <div ref={container} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-bg">
          <p className="flex items-center gap-2 text-sm text-muted">
            {error ? (
              t("common.mapError")
            ) : (
              <>
                <Loader2 className="animate-spin" size={18} />
                {t("common.loadingMap")}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

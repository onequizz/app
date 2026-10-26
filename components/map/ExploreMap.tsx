"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  LngLatBounds,
  Map as MlMap,
  Marker,
  type GeoJSONSource,
  type MapMouseEvent,
  type PaddingOptions,
  type StyleSpecification,
} from "maplibre-gl";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES, getCountry, ZONE_BOUNDS } from "@/lib/data/countries";
import { FEATURE_COLORS, findFeature } from "@/lib/data/features";
import { getFeatureShape, loadFeatures } from "@/lib/geo/features";
import { loadWorld, type WorldData } from "@/lib/geo/world";
import { isRtl } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { GeoFeature } from "@/lib/types";
import { EMPTY_FC, graticule, labelEl, markerEl, readPalette, type Palette } from "./mapShared";

export interface ExploreMapProps {
  /** Pays affiché (code ISO), ou null. */
  selected: string | null;
  /** Cible nature mise en avant (identifiant Wikidata), ou null. */
  focus: string | null;
  /** Cibles nature du pays affiché. */
  items: GeoFeature[];
  onSelect: (code: string) => void;
  onFocus: (id: string) => void;
}

// Les territoires sans fiche (Groenland, Hong Kong…) restent visibles mais ne sont pas cliquables.
const KNOWN = new Set(COUNTRIES.map((c) => c.code));
const ITEM_LAYERS = ["items-point", "items-line", "items-fill"];
const POLYGON = ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]];
const POINT = ["in", ["geometry-type"], ["literal", ["Point", "MultiPoint"]]];
const LINE = ["in", ["geometry-type"], ["literal", ["LineString", "MultiLineString"]]];
const KIND_COLOR = ["match", ["get", "kind"], ...Object.entries(FEATURE_COLORS).flat(), "#888"];
const NONE = ["==", ["get", "id"], ""];

function buildStyle(world: WorldData, p: Palette): StyleSpecification {
  return {
    version: 8,
    sources: {
      countries: { type: "geojson", data: world, promoteId: "code" },
      graticule: { type: "geojson", data: graticule() },
      items: { type: "geojson", data: EMPTY_FC },
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": p.ocean } },
      { id: "graticule", type: "line", source: "graticule", paint: { "line-color": p.graticule, "line-width": 1 } },
      { id: "countries-fill", type: "fill", source: "countries", paint: { "fill-color": fillColor(p) } },
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
        id: "selected-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "code"], ""],
        paint: { "line-color": p.accent, "line-width": 2.5 },
      },
      {
        id: "items-fill",
        type: "fill",
        source: "items",
        filter: POLYGON as never,
        paint: { "fill-color": KIND_COLOR as never, "fill-opacity": 0.28 },
      },
      {
        id: "items-line",
        type: "line",
        source: "items",
        filter: ["!", POINT] as never,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": KIND_COLOR as never, "line-width": ["case", LINE, 3, 1.5] as never },
      },
      {
        id: "items-point",
        type: "circle",
        source: "items",
        filter: POINT as never,
        paint: {
          "circle-radius": 6,
          "circle-color": KIND_COLOR as never,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      },
      {
        id: "focus-fill",
        type: "fill",
        source: "items",
        filter: ["all", NONE, POLYGON] as never,
        paint: { "fill-color": p.reveal, "fill-opacity": 0.4 },
      },
      {
        id: "focus-line",
        type: "line",
        source: "items",
        filter: ["all", NONE, ["!", POINT]] as never,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": p.reveal, "line-width": ["case", LINE, 5, 2.5] as never },
      },
    ],
  };
}

function fillColor(p: Palette) {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    p.landHover,
    ["boolean", ["feature-state", "hover"], false],
    p.landHover,
    p.land,
  ] as never;
}

/** Tracé de chaque cible, ou son point d'étiquette quand le tracé manque. */
function itemsData(items: GeoFeature[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.map((f): Feature<Geometry> => {
      const shape = getFeatureShape(f.id);
      return {
        type: "Feature",
        properties: { id: f.id, kind: f.kind },
        geometry: shape?.geometry ?? { type: "Point", coordinates: [f.anchor[1], f.anchor[0]] },
      };
    }),
  };
}

/** Marge laissée au panneau de la fiche : sur le côté en grand écran, en bas sur mobile. */
function panelPadding(el: HTMLElement, rtl: boolean): PaddingOptions {
  if (el.clientWidth >= 1024) return { top: 90, bottom: 40, left: rtl ? 450 : 40, right: rtl ? 40 : 450 };
  return { top: 120, bottom: Math.round(el.clientHeight * 0.5) + 16, left: 24, right: 24 };
}

export default function ExploreMap(props: ExploreMapProps) {
  const { t, locale } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const hoverLabel = useRef<Marker | null>(null);
  const hovered = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shapesReady, setShapesReady] = useState(false);
  const [error, setError] = useState(false);

  // Valeurs lues par les gestionnaires d'événements MapLibre.
  const live = useRef({ ...props, locale });
  useEffect(() => {
    live.current = { ...props, locale };
  });

  // --- Création de la carte -------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;
    // Les couches n'existent qu'une fois le style chargé : avant, survol et clic sont ignorés.
    let loaded = false;

    // Les tracés nature servent à dessiner fleuves, lacs… du pays choisi.
    loadFeatures()
      .catch(() => {})
      .then(() => !cancelled && setShapesReady(true));

    loadWorld()
      .then((world) => {
        if (cancelled || !container.current) return;
        map = new MlMap({
          container: container.current,
          style: buildStyle(world, readPalette()),
          bounds: ZONE_BOUNDS.world,
          fitBoundsOptions: { padding: 20 },
          attributionControl: { compact: true, customAttribution: "Natural Earth" },
          dragRotate: false,
          pitchWithRotate: false,
          maxZoom: 9,
        });
        map.touchZoomRotate.disableRotation();
        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) return;
          loaded = true;
          map!.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
          setReady(true);
        });

        // Ce qui se trouve sous le pointeur : une cible nature d'abord (plus fine), sinon un pays.
        const pick = (e: MapMouseEvent): { item?: string; country?: string } => {
          if (!loaded) return {};
          const { x, y } = e.point;
          const box: [[number, number], [number, number]] = [
            [x - 5, y - 5],
            [x + 5, y + 5],
          ];
          const item = map!.queryRenderedFeatures(box, { layers: ITEM_LAYERS })[0]?.properties?.id as
            | string
            | undefined;
          if (item) return { item };
          const code = map!.queryRenderedFeatures(e.point, { layers: ["countries-fill"] })[0]?.properties?.code as
            | string
            | undefined;
          return { country: code && KNOWN.has(code) ? code : undefined };
        };

        const setHover = (code: string | null) => {
          if (code === hovered.current) return;
          if (hovered.current) map!.setFeatureState({ source: "countries", id: hovered.current }, { hover: false });
          if (code) map!.setFeatureState({ source: "countries", id: code }, { hover: true });
          hovered.current = code;
        };

        map.on("mousemove", (e) => {
          const { item, country } = pick(e);
          const loc = live.current.locale;
          setHover(country ?? null);
          map!.getCanvas().style.cursor = item || country ? "pointer" : "";
          hoverLabel.current?.remove();
          hoverLabel.current = null;
          const feature = item ? findFeature(item) : undefined;
          const label = feature ? feature.names[loc] : country ? getCountry(country).names[loc] : null;
          if (!label) return;
          const color = feature ? FEATURE_COLORS[feature.kind] : readPalette().accent;
          hoverLabel.current = new Marker({ element: labelEl(color, label) }).setLngLat(e.lngLat).addTo(map!);
        });
        map.getCanvas().addEventListener("mouseleave", () => {
          setHover(null);
          hoverLabel.current?.remove();
          hoverLabel.current = null;
        });

        map.on("click", (e) => {
          const { item, country } = pick(e);
          if (item) live.current.onFocus(item);
          else if (country) live.current.onSelect(country);
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
      m.setPaintProperty("countries-fill", "fill-color", fillColor(p));
      m.setPaintProperty("selected-outline", "line-color", p.accent);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelled = true;
      observer.disconnect();
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      hoverLabel.current?.remove();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Tracés des cibles nature du pays -----------------------------------------
  const { selected, focus, items } = props;
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("items") as GeoJSONSource | undefined)?.setData(itemsData(items));
  }, [ready, shapesReady, items]);

  // --- Pays et cible mis en avant, marqueurs et cadrage ---------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const palette = readPalette();

    markers.current.forEach((m) => m.remove());
    markers.current = [];
    if (selectedRef.current) map.setFeatureState({ source: "countries", id: selectedRef.current }, { selected: false });
    selectedRef.current = selected;
    map.setFilter("selected-outline", ["==", ["get", "code"], selected ?? ""]);
    const focusFilter = ["==", ["get", "id"], focus ?? ""];
    map.setFilter("focus-fill", ["all", focusFilter, POLYGON] as never);
    map.setFilter("focus-line", ["all", focusFilter, ["!", POINT]] as never);

    const options = { padding: panelPadding(map.getContainer(), isRtl(locale)), duration: 1000 };

    if (!selected) {
      map.fitBounds(ZONE_BOUNDS.world, { ...options, padding: 20 });
      return;
    }

    const country = getCountry(selected);
    map.setFeatureState({ source: "countries", id: selected }, { selected: true });
    if (country.capital) {
      markers.current.push(
        new Marker({ element: markerEl(palette.accent, country.capital.names[locale], "target") })
          .setLngLat([country.capital.lng, country.capital.lat])
          .addTo(map),
      );
    }

    const feature = focus ? findFeature(focus) : undefined;
    if (feature) {
      const shape = getFeatureShape(feature.id);
      const [lat, lng] =
        shape?.geometry.type === "Point"
          ? [shape.geometry.coordinates[1], shape.geometry.coordinates[0]]
          : feature.anchor;
      markers.current.push(
        new Marker({ element: markerEl(palette.reveal, feature.names[locale], "target", true) })
          .setLngLat([lng, lat])
          .addTo(map),
      );
      const bounds = new LngLatBounds([feature.bbox[0], feature.bbox[1]], [feature.bbox[2], feature.bbox[3]]);
      bounds.extend([lng, lat]);
      map.fitBounds(bounds, { ...options, maxZoom: 6.5 });
      return;
    }

    if (country.bbox) {
      const [w, s, e, n] = country.bbox;
      map.fitBounds([w, s, e, n], { ...options, maxZoom: 6.5 });
    } else {
      map.flyTo({ center: [country.center[1], country.center[0]], zoom: 6, padding: options.padding, duration: 1000 });
    }
  }, [ready, selected, focus, locale]);

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

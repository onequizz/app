// Copie le Web Worker de MapLibre dans public/ : une fois bundlé, MapLibre ne peut plus
// déduire son URL depuis import.meta.url. Exécuté automatiquement avant dev et build.
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dest = join(root, "public/maplibre");
mkdirSync(dest, { recursive: true });
copyFileSync(
  join(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"),
  join(dest, "maplibre-gl-worker.mjs"),
);

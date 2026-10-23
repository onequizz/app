# OneQuizz — Find the Country / Capital

Jeu de géographie : une cible (pays ou capitale) est tirée au sort par une roulette, il faut la pointer sur une carte interactive. Distance d'erreur en km, révélation de la cible, combos, indices, contre-la-montre, défi du jour, carnet de révision. Interface en français, anglais, arabe (RTL) et espagnol.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3001
npm run build:data   # (optionnel) régénère data/countries.json, public/geo/world.json, public/flags
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide · Zustand · MapLibre GL (sans clé API, sans tuiles tierces) · Turf.

## Données

| Fichier | Source |
|---|---|
| `public/geo/world.json` | Natural Earth 1:50m (domaine public) via `world-atlas` |
| `data/countries.json` | `world-countries` (noms traduits) + Wikidata (capitales, coordonnées, population, titres Wikipédia) |
| `public/flags/*.svg` | `country-flag-icons` (MIT) |

**Sahara Occidental** : Natural Earth 4.1 rattache au Maroc la partie située à l'ouest du mur de sable. `scripts/build-data.ts` (`fixWesternSahara`) rétablit le territoire complet en découpant le long du parallèle 27°40′N : le Sahara Occidental (`EH`) est un polygone distinct, séparé du Maroc. Somaliland et Chypre du Nord sont fusionnés avec la Somalie et Chypre.

## Architecture

```
app/                 pages (/, /play, /stats) + api/fact/[code] (résumés Wikipédia)
components/
  map/GameMap.tsx    carte MapLibre : couches pays, lignes d'erreur, marqueurs, révélation
  game/              roulette, carte cible + indices, HUD, feedback, résultat, fiche, bilan
  settings/          panneau de paramètres
  ui/                boutons, segmented, slider, toggle, drawer, drapeaux, logo
lib/
  geo/               Haversine, grand cercle, validation (point-dans-polygone / distance à la frontière)
  game/engine.ts     score, combos, tirage pondéré, défi du jour (aléatoire à graine), chaud/froid
  i18n/              config, messages fr/en/ar/es, provider
  audio/sfx.ts       sons synthétisés (Web Audio API)
store/               Zustand : settings & stats (persistés), game (machine à états)
scripts/build-data.ts
```

## Règles de validation

- **Capitale** : correct si la distance Haversine au clic ≤ tolérance.
- **Pays** : correct si le clic est dans le polygone, ou à moins de la tolérance de sa frontière ; les micro-États ont un rayon minimal (30–80 km). La distance affichée est celle jusqu'au point de frontière le plus proche.

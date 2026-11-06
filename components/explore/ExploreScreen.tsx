"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Dices, Maximize2, Mountain, MousePointerClick, Search, Users, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";
import { FactCard } from "@/components/game/FactCard";
import { FeatureMeasure } from "@/components/game/FeatureFacts";
import { IconButton, buttonClass } from "@/components/ui/controls";
import { Flag } from "@/components/ui/Flag";
import { KindIcon } from "@/components/ui/KindIcon";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { StatGrid } from "@/components/ui/StatGrid";
import { COUNTRIES, getCountry } from "@/lib/data/countries";
import { FEATURE_COLORS, FEATURE_KINDS, featuresInCountry, getFeature } from "@/lib/data/features";
import { isRtl, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { GeoFeature } from "@/lib/types";

const ExploreMap = dynamic(() => import("@/components/map/ExploreMap"), { ssr: false });

/** Comparaison sans casse ni accents (« eg » trouve « Égypte »). */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function searchCountries(query: string, locale: Locale) {
  const q = fold(query.trim());
  if (!q) return [];
  const scored = COUNTRIES.flatMap((c) => {
    const name = fold(c.names[locale]);
    const rank = name.startsWith(q) ? 0 : name.includes(q) ? 1 : fold(c.names.en).includes(q) || c.code.toLowerCase() === q ? 2 : -1;
    return rank < 0 ? [] : [{ c, rank }];
  });
  return scored
    .sort((a, b) => a.rank - b.rank || a.c.names[locale].localeCompare(b.c.names[locale], locale))
    .slice(0, 8)
    .map((s) => s.c);
}

function CountrySearch({ onSelect }: { onSelect: (code: string) => void }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const results = useMemo(() => searchCountries(query, locale), [query, locale]);

  const choose = (code: string) => {
    onSelect(code);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
      <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={query}
        role="combobox"
        aria-expanded={open && query.trim() !== ""}
        aria-controls={listId}
        aria-label={t("explore.search")}
        placeholder={t("explore.search")}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) choose(results[0].code);
          if (e.key === "Escape") setOpen(false);
        }}
        className="glass h-11 w-full rounded-full ps-10 pe-4 text-sm shadow-lg outline-none focus:border-accent"
      />
      {open && query.trim() !== "" && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-surface-solid py-1 shadow-2xl"
        >
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">{t("explore.noResult")}</li>}
          {results.map((c) => (
            <li key={c.code} role="option" aria-selected={false}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(c.code)}
                className="flex w-full items-center gap-3 px-4 py-2 text-start text-sm hover:bg-surface-2"
              >
                <Flag code={c.code} className="h-5" />
                <span className="truncate font-semibold">{c.names[locale]}</span>
                <span className="ms-auto text-xs text-muted">{t(`zone.${c.region}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({ feature, country, onFocus }: { feature: GeoFeature; country: string; onFocus: () => void }) {
  const { t, locale } = useI18n();
  const others = feature.countries.filter((c) => c !== country);
  return (
    <li>
      <button
        onClick={onFocus}
        className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-start transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-white"
          style={{ background: FEATURE_COLORS[feature.kind] }}
        >
          <KindIcon kind={feature.kind} size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{feature.names[locale]}</span>
          {others.length > 0 && (
            <span className="block truncate text-xs text-muted">
              {t("explore.sharedWith", {
                list: others.map((c) => getCountry(c).names[locale]).join(", "),
              })}
            </span>
          )}
        </span>
        <span className="tabular shrink-0 pt-0.5 text-xs font-bold text-muted">
          <FeatureMeasure feature={feature} />
        </span>
      </button>
    </li>
  );
}

function CountryDetails({ code, items, onFocus }: { code: string; items: GeoFeature[]; onFocus: (id: string) => void }) {
  const { t, n } = useI18n();
  const c = getCountry(code);
  const groups = FEATURE_KINDS.map((kind) => ({ kind, list: items.filter((f) => f.kind === kind) })).filter(
    (g) => g.list.length > 0,
  );

  return (
    <div className="space-y-5">
      <FactCard target={{ kind: "country", code }} />
      <StatGrid
        stats={[
          { icon: Maximize2, label: t("measure.area"), value: c.area ? t("unit.km2", { n: n(c.area) }) : "—" },
          {
            icon: Users,
            label: t("explore.density"),
            value:
              c.population && c.area
                ? t("explore.densityUnit", { n: n(c.population / c.area, { maximumFractionDigits: 0 }) })
                : "—",
          },
          { icon: Mountain, label: t("explore.features"), value: n(items.length) },
        ]}
      />

      <section>
        <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">{t("explore.inCountry")}</h3>
        {groups.length === 0 && (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">{t("explore.nothing")}</p>
        )}
        <div className="space-y-4">
          {groups.map(({ kind, list }) => (
            <div key={kind}>
              <div className="mb-1 flex items-center gap-2 px-2 text-sm font-bold">
                <span className="size-2.5 rounded-full" style={{ background: FEATURE_COLORS[kind] }} />
                {t(`quiz.${kind}`)}
                <span className="tabular text-xs text-muted">{n(list.length)}</span>
              </div>
              <ul>
                {list.map((f) => (
                  <ItemRow key={f.id} feature={f} country={code} onFocus={() => onFocus(f.id)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Atlas : pas de quiz, on clique sur un pays pour découvrir tout ce qu'il contient. */
export function ExploreScreen() {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const items = useMemo(() => (selected ? featuresInCountry(selected) : []), [selected]);

  const select = useCallback((code: string) => {
    setSelected(code);
    setFocus(null);
  }, []);
  const close = () => {
    setSelected(null);
    setFocus(null);
  };
  const random = () => select(COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].code);

  const country = selected ? getCountry(selected) : null;

  return (
    <main className="fixed inset-0 overflow-hidden bg-bg">
      <ExploreMap selected={selected} focus={focus} items={items} onSelect={select} onFocus={setFocus} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2 p-3 sm:p-4">
        <Link
          href="/"
          aria-label={t("nav.home")}
          title={t("nav.home")}
          className="glass pointer-events-auto flex h-11 shrink-0 items-center rounded-full px-1.5 shadow-lg transition hover:border-accent/50 sm:pe-4 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Logo size="sm" className="max-sm:[&>span]:hidden" />
        </Link>
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2">
          <CountrySearch onSelect={select} />
          <button
            onClick={random}
            title={t("explore.random")}
            aria-label={t("explore.random")}
            className={buttonClass("secondary", "md", "shrink-0 shadow-lg max-sm:size-11 max-sm:px-0")}
          >
            <Dices size={18} />
            <span className="max-sm:hidden">{t("explore.random")}</span>
          </button>
        </div>
        <div className="glass pointer-events-auto shrink-0 rounded-full shadow-lg max-sm:hidden">
          <LanguageSwitcher />
        </div>
      </header>

      <LegalLinks className="pointer-events-auto absolute bottom-1.5 left-3 z-10 justify-start gap-x-3 text-[10px] opacity-60 transition-opacity hover:opacity-100 max-sm:hidden" />

      <AnimatePresence mode="wait">
        {country ? (
          <motion.aside
            key="panel"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            aria-label={country.names[locale]}
            className={clsx(
              "absolute z-20 flex flex-col overflow-hidden border border-line bg-surface-solid shadow-2xl",
              "inset-x-0 bottom-0 max-h-[50dvh] rounded-t-3xl",
              "lg:inset-x-auto lg:top-20 lg:bottom-4 lg:end-4 lg:max-h-none lg:w-[410px] lg:rounded-3xl",
            )}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              {focus ? (
                <button
                  onClick={() => setFocus(null)}
                  className="flex min-w-0 items-center gap-2 rounded-full px-2 py-1.5 text-sm font-bold text-accent hover:bg-surface-2"
                >
                  <ArrowLeft size={16} className={clsx("shrink-0", isRtl(locale) && "rotate-180")} />
                  <span className="truncate">{t("explore.back")}</span>
                </button>
              ) : (
                <span className="truncate px-2 text-xs font-bold tracking-wide text-muted uppercase">
                  {t("explore.title")}
                </span>
              )}
              <IconButton label={t("common.close")} onClick={close} className="ms-auto shrink-0">
                <X size={18} />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {focus ? (
                <FactCard key={focus} target={{ kind: getFeature(focus).kind, code: focus }} />
              ) : (
                <CountryDetails key={country.code} code={country.code} items={items} onFocus={setFocus} />
              )}
            </div>
          </motion.aside>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4"
          >
            <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-xl">
              <MousePointerClick size={18} className="shrink-0 text-accent" />
              <div>
                <div className="font-display font-bold">{t("explore.title")}</div>
                <div className="text-xs text-muted">{t("explore.hint")}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

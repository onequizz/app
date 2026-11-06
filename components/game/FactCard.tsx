"use client";

import {
  BookOpen,
  ExternalLink,
  Flag as FlagIcon,
  Globe2,
  Landmark,
  RotateCcw,
  Ruler,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Flag } from "@/components/ui/Flag";
import { KindIcon } from "@/components/ui/KindIcon";
import { StatGrid } from "@/components/ui/StatGrid";
import { getCountry } from "@/lib/data/countries";
import { getFeature, isFeatureKind } from "@/lib/data/features";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { GeoFeature, Target } from "@/lib/types";
import { useFeatureMeasure } from "./FeatureFacts";

export interface Fact {
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
  lang: string;
}

/** Résumé chargé, article absent dans la langue (avec le lien anglais), ou panne passagère. */
type FactState = { status: "ok"; fact: Fact } | { status: "missing"; url: string | null } | { status: "error" };

// Les pannes ne sont pas mises en cache : la fiche est redemandée à la prochaine ouverture.
const cache = new Map<string, FactState>();

function CountryHeader({ code }: { code: string }) {
  const { t, n, locale } = useI18n();
  const c = getCountry(code);
  return (
    <>
      <div className="flex items-center gap-3">
        <Flag code={code} className="h-9" title={c.names[locale]} />
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold">{c.names[locale]}</div>
          <div className="text-xs text-muted">{t(`zone.${c.region}`)}</div>
        </div>
      </div>
      <StatGrid
        stats={[
          { icon: Landmark, label: t("fact.capital"), value: c.capital?.names[locale] ?? "—" },
          {
            icon: Users,
            label: t("fact.population"),
            value: c.population ? n(c.population, { notation: "compact", maximumFractionDigits: 1 }) : "—",
          },
          { icon: Globe2, label: t("fact.region"), value: t(`zone.${c.region}`) },
        ]}
      />
    </>
  );
}

function FeatureHeader({ feature: f }: { feature: GeoFeature }) {
  const { t, locale } = useI18n();
  const measure = useFeatureMeasure(f);
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
          <KindIcon kind={f.kind} size={20} />
        </span>
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold">{f.names[locale]}</div>
          <div className="text-xs text-muted">{t(`quiz.${f.kind}`)}</div>
        </div>
      </div>
      <StatGrid
        stats={[
          { icon: Globe2, label: t("fact.region"), value: f.region ? t(`zone.${f.region}`) : t("zone.world") },
          {
            icon: FlagIcon,
            label: t("hint.countries"),
            value: f.countries.length ? f.countries.map((c) => getCountry(c).names[locale]).join(", ") : "—",
          },
          { icon: Ruler, label: measure?.label ?? t("measure.area"), value: measure?.value ?? "—" },
        ]}
      />
    </>
  );
}

/** Fiche de la cible : chiffres clés + résumé Wikipédia dans la langue de l'interface. */
export function FactCard({ target }: { target: Target }) {
  const { t, locale } = useI18n();
  const code = target.code;
  const key = `${code}:${locale}`;
  const [loaded, setLoaded] = useState<{ key: string; state: FactState } | null>(null);
  const [retry, setRetry] = useState(0);
  // undefined = en cours de chargement.
  const state = cache.get(key) ?? (loaded?.key === key ? loaded.state : undefined);

  useEffect(() => {
    if (cache.has(key)) return;
    const ctrl = new AbortController();
    fetch(`/api/fact/${code}?lang=${locale}`, { signal: ctrl.signal })
      .then(async (r): Promise<FactState> => {
        if (r.ok) return { status: "ok", fact: (await r.json()) as Fact };
        const body = (await r.json().catch(() => null)) as { error?: string; url?: string | null } | null;
        return body?.error === "missing" ? { status: "missing", url: body.url ?? null } : { status: "error" };
      })
      .then((next) => {
        if (next.status !== "error") cache.set(key, next);
        setLoaded({ key, state: next });
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setLoaded({ key, state: { status: "error" } });
      });
    return () => ctrl.abort();
  }, [code, locale, key, retry]);

  const fact = state?.status === "ok" ? state.fact : null;

  return (
    <div className="space-y-3">
      {isFeatureKind(target.kind) ? <FeatureHeader feature={getFeature(code)} /> : <CountryHeader code={code} />}

      <div className="flex gap-3 text-sm">
        {state === undefined && (
          <div className="w-full space-y-2" aria-label={t("fact.loading")}>
            <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
          </div>
        )}
        {state?.status === "missing" && (
          <div className="text-muted">
            <p>{t("fact.missing")}</p>
            {state.url && (
              <a
                href={state.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
              >
                {t("fact.readEnglish")}
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
        {state?.status === "error" && (
          <div className="flex flex-wrap items-center gap-2 text-muted">
            <p>{t("fact.unavailable")}</p>
            <button
              onClick={() => {
                setLoaded(null);
                setRetry((n) => n + 1);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
            >
              <RotateCcw size={12} />
              {t("fact.retry")}
            </button>
          </div>
        )}
        {fact && (
          <>
            {fact.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fact.thumbnail}
                alt=""
                className="hidden size-20 shrink-0 rounded-xl object-cover sm:block"
              />
            )}
            <div className="min-w-0">
              <p dir="auto" lang={fact.lang} className="line-clamp-5 leading-relaxed text-ink/90">
                <BookOpen size={14} className="me-1.5 inline align-[-2px] text-accent" />
                {fact.extract}
              </p>
              <a
                href={fact.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
              >
                {t("fact.readMore")}
                <ExternalLink size={12} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

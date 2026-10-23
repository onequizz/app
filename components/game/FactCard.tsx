"use client";

import { BookOpen, ExternalLink, Landmark, Users, Globe2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Flag } from "@/components/ui/Flag";
import { getCountry } from "@/lib/data/countries";
import { useI18n } from "@/lib/i18n/I18nProvider";

export interface Fact {
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
  lang: string;
}

const cache = new Map<string, Fact | null>();

/** Fiche pays : chiffres clés + résumé Wikipédia dans la langue de l'interface. */
export function FactCard({ code }: { code: string }) {
  const { t, n, locale } = useI18n();
  const c = getCountry(code);
  const key = `${code}:${locale}`;
  const [loaded, setLoaded] = useState<{ key: string; fact: Fact | null } | null>(null);
  // undefined = en cours de chargement, null = indisponible.
  const fact = cache.has(key) ? cache.get(key) : loaded?.key === key ? loaded.fact : undefined;

  useEffect(() => {
    if (cache.has(key)) return;
    const ctrl = new AbortController();
    fetch(`/api/fact/${code}?lang=${locale}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Fact>) : null))
      .then((f) => {
        cache.set(key, f);
        setLoaded({ key, fact: f });
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setLoaded({ key, fact: null });
      });
    return () => ctrl.abort();
  }, [code, locale, key]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Flag code={code} className="h-9" title={c.names[locale]} />
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold">{c.names[locale]}</div>
          <div className="text-xs text-muted">{t(`zone.${c.region}`)}</div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Landmark, label: t("fact.capital"), value: c.capital?.names[locale] ?? "—" },
          {
            icon: Users,
            label: t("fact.population"),
            value: c.population ? n(c.population, { notation: "compact", maximumFractionDigits: 1 }) : "—",
          },
          { icon: Globe2, label: t("fact.region"), value: t(`zone.${c.region}`) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-surface-2 px-2 py-2">
            <dt className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-wide text-muted uppercase">
              <Icon size={11} />
              {label}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-3 text-sm">
        {fact === undefined && (
          <div className="w-full space-y-2" aria-label={t("fact.loading")}>
            <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
          </div>
        )}
        {fact === null && <p className="text-muted">{t("fact.unavailable")}</p>}
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

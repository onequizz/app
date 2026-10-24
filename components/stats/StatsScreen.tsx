"use client";

import clsx from "clsx";
import { ArrowLeft, BookMarked, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button, buttonClass } from "@/components/ui/controls";
import { Flag } from "@/components/ui/Flag";
import { KindIcon } from "@/components/ui/KindIcon";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { parseTargetKey, targetLabel } from "@/lib/data/countries";
import { findFeature, isFeatureKind } from "@/lib/data/features";
import { reviewPool } from "@/lib/game/engine";
import { isRtl } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useStats } from "@/store/stats";
import { useHydrated } from "@/store/useHydrated";

export function StatsScreen() {
  const { t, n, locale } = useI18n();
  const hydrated = useHydrated();
  const stats = useStats();

  const notebook = useMemo(() => reviewPool(stats.targets), [stats.targets]);
  const accuracy = stats.rounds ? Math.round((stats.correct / stats.rounds) * 100) : 0;

  return (
    <div className="graticule-bg min-h-full">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className={buttonClass("ghost", "sm")}>
          <ArrowLeft size={17} className={clsx(isRtl(locale) && "rotate-180")} />
          {t("common.back")}
        </Link>
        <LanguageSwitcher />
      </nav>

      <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">{t("stats.title")}</h1>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("home.games"), value: n(stats.games) },
            { label: t("stats.rounds"), value: n(stats.rounds) },
            { label: t("home.accuracy"), value: `${n(accuracy)} %` },
            { label: t("home.bestStreak"), value: n(stats.bestStreak) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface-solid px-4 py-3">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="tabular font-display text-3xl font-extrabold">{hydrated ? s.value : "—"}</div>
            </div>
          ))}
        </section>

        {hydrated && stats.rounds === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">{t("stats.empty")}</p>
        )}

        {notebook.length > 0 && (
          <section className="rounded-3xl border border-line bg-surface-solid p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <BookMarked size={20} className="text-accent" />
                {t("stats.notebook")}
              </h2>
              <Link href="/play?mode=review" className={buttonClass("primary", "sm")}>
                <Play size={15} />
                {t("mode.review.title")}
              </Link>
            </div>
            <p className="mb-4 text-sm text-muted">{t("stats.notebookHelp")}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {notebook.slice(0, 30).map((key) => {
                const target = parseTargetKey(key);
                if (isFeatureKind(target.kind) && !findFeature(target.code)) return null;
                const s = stats.targets[key];
                const total = s.hits + s.misses;
                return (
                  <li key={key} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2">
                    {isFeatureKind(target.kind) ? (
                      <span className="grid h-6 w-9 shrink-0 place-items-center rounded-[3px] bg-accent/12 text-accent">
                        <KindIcon kind={target.kind} size={15} />
                      </span>
                    ) : (
                      <Flag code={target.code} className="h-6" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate text-sm font-bold">
                        <KindIcon kind={target.kind} size={13} />
                        {targetLabel(target, locale)}
                      </div>
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-danger/25">
                        <span className="bg-success" style={{ width: `${(s.hits / total) * 100}%` }} />
                      </div>
                    </div>
                    <span className="tabular text-xs text-muted">
                      {n(s.hits)} {t("stats.hits")} · {n(s.misses)} {t("stats.misses")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {stats.history.length > 0 && (
          <section className="rounded-3xl border border-line bg-surface-solid p-5">
            <h2 className="mb-3 font-display text-xl font-bold">{t("stats.history")}</h2>
            <ul className="divide-y divide-line">
              {stats.history.map((g, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold">{t(`mode.${g.mode}.title`)}</span>
                  <span className="text-muted">{g.date}</span>
                  <span className="tabular text-muted">
                    {n(g.correct)}/{n(g.total)}
                  </span>
                  <span className="tabular font-bold text-accent">{t("unit.pts", { n: n(g.score) })}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hydrated && stats.rounds > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.confirm(t("stats.resetConfirm")) && stats.reset()}
            >
              <Trash2 size={15} />
              {t("stats.reset")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

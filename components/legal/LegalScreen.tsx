"use client";

import clsx from "clsx";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Button, buttonClass } from "@/components/ui/controls";
import { Logo } from "@/components/ui/Logo";
import { intlLocale, isRtl, LOCALE_COOKIE } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LEGAL_DOCS, LEGAL_INFO, type LegalDoc } from "@/lib/legal/config";
import { LEGAL_CONTENT } from "@/lib/legal/content";
import { SETTINGS_STORAGE_KEY } from "@/store/settings";
import { STATS_STORAGE_KEY } from "@/store/stats";

const VARS: Record<string, string> = {
  publisher: LEGAL_INFO.publisher,
  contact: LEGAL_INFO.contact,
  jurisdiction: LEGAL_INFO.jurisdiction,
  host: LEGAL_INFO.host.name,
  hostAddress: LEGAL_INFO.host.address,
  hostUrl: LEGAL_INFO.host.url,
};

const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => VARS[k] ?? m);

/** Supprime le cookie de langue et les données de jeu de ce navigateur, puis recharge l'accueil. */
function ClearData() {
  const { t } = useI18n();
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");

  const clear = () => {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      localStorage.removeItem(STATS_STORAGE_KEY);
    } catch {}
    document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0; samesite=lax`;
    setStep("done");
    // Rechargement complet voulu : avec une navigation client, les stores encore en mémoire
    // réécriraient les données qu'on vient d'effacer.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    setTimeout(() => window.location.assign("/"), 900);
  };

  if (step === "done") {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-success">
        <Check size={16} />
        {t("legal.cleared")}
      </p>
    );
  }
  return (
    <Button
      variant={step === "confirm" ? "primary" : "secondary"}
      onClick={() => (step === "confirm" ? clear() : setStep("confirm"))}
      className={clsx(step === "confirm" && "bg-danger shadow-danger/25")}
    >
      <Trash2 size={16} />
      {step === "confirm" ? t("legal.clearConfirm") : t("legal.clear")}
    </Button>
  );
}

export function LegalScreen({ doc }: { doc: LegalDoc }) {
  const { t, locale } = useI18n();
  const text = LEGAL_CONTENT[locale][doc];
  const updated = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long" }).format(
    new Date(`${LEGAL_INFO.updated}T12:00:00`),
  );

  return (
    <div className="graticule-bg min-h-full">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <Link href="/" className={buttonClass("ghost", "sm")}>
          <ArrowLeft size={17} className={clsx(isRtl(locale) && "rotate-180")} />
          <Logo size="sm" className="max-sm:[&>span]:hidden" />
        </Link>
        <LanguageSwitcher />
      </nav>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {LEGAL_DOCS.map((d) => (
            <Link
              key={d}
              href={`/legal/${d}`}
              aria-current={d === doc ? "page" : undefined}
              className={clsx(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                d === doc
                  ? "border-accent bg-accent/12 text-ink"
                  : "border-line text-muted hover:border-accent/50 hover:text-ink",
              )}
            >
              {t(`legal.${d}`)}
            </Link>
          ))}
        </div>

        <article className="rounded-3xl border border-line bg-surface-solid p-5 shadow-sm sm:p-8">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{text.title}</h1>
          <p className="mt-1 text-xs text-muted">{t("legal.updated", { date: updated })}</p>
          <p className="mt-4 text-base text-ink/90">{fill(text.intro)}</p>

          <div className="mt-6 space-y-6">
            {text.blocks.map((b) => (
              <section key={b.h}>
                <h2 className="mb-2 font-display text-lg font-bold">{b.h}</h2>
                <div className="space-y-2 text-sm leading-relaxed text-ink/85">
                  {b.p?.map((p) => <p key={p}>{fill(p)}</p>)}
                  {b.ul && (
                    <ul className="list-disc space-y-1 ps-5 marker:text-accent">
                      {b.ul.map((li) => (
                        <li key={li}>{fill(li)}</li>
                      ))}
                    </ul>
                  )}
                  {b.table && (
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full min-w-[520px] text-start text-sm">
                        <thead className="bg-surface-2 text-xs font-bold tracking-wide text-muted uppercase">
                          <tr>
                            {b.table[0].map((c) => (
                              <th key={c} className="px-3 py-2 text-start">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {b.table.slice(1).map((row) => (
                            <tr key={row[0]} className="border-t border-line">
                              {row.map((c, i) => (
                                <td key={i} className={clsx("px-3 py-2 align-top", i === 0 && "font-mono text-xs font-bold")}>
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            ))}
            {doc === "cookies" && <ClearData />}
          </div>
        </article>
      </main>
    </div>
  );
}

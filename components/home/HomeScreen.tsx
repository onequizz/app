"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  CalendarDays,
  Crosshair,
  Landmark,
  MapPin,
  Settings2,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { buttonClass, IconButton } from "@/components/ui/controls";
import { Flag } from "@/components/ui/Flag";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";
import { targetLabel, targetPool } from "@/lib/data/countries";
import { mulberry32, reviewPool, shuffle, todayKey } from "@/lib/game/engine";
import { isRtl } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SessionMode, Target } from "@/lib/types";
import { useSettings } from "@/store/settings";
import { useStats } from "@/store/stats";
import { useHydrated } from "@/store/useHydrated";

/** Aperçu animé de la roulette dans le bandeau d'accueil. */
function RoulettePreview() {
  const { t, locale } = useI18n();
  // Graine fixe : même liste côté serveur et client (pas d'écart d'hydratation).
  const targets = useMemo<Target[]>(
    () => shuffle(targetPool("world", "mixed"), mulberry32(7)).slice(0, 40),
    [],
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((x) => x + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const current = targets[i % targets.length];

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-accent/20 blur-3xl" aria-hidden />
      <div className="glass relative rounded-3xl p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between text-xs font-bold tracking-wide text-accent uppercase">
          <span>{current?.kind === "capital" ? t("target.findCapital") : t("target.findCountry")}</span>
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-accent" />
            <span className="size-2.5 rounded-full bg-accent" />
            <span className="size-2.5 rounded-full bg-accent/30" />
          </span>
        </div>
        <div className="relative h-16 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {current && (
              <motion.div
                key={i}
                initial={{ y: 64, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -64, opacity: 0, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="absolute inset-0 flex items-center gap-3"
              >
                {current.kind === "capital" ? (
                  <Landmark className="shrink-0 text-accent" size={26} />
                ) : (
                  <MapPin className="shrink-0 text-accent" size={26} />
                )}
                <span className="truncate font-display text-3xl font-extrabold">{targetLabel(current, locale)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <Crosshair className="text-danger" size={20} />
          <span className="h-px flex-1 border-t-2 border-dashed border-danger/60" />
          <span className="tabular text-sm font-bold text-danger">{t("unit.km", { n: "842" })}</span>
          <span className="h-px flex-1 border-t-2 border-dashed border-danger/60" />
          <MapPin className="text-success" size={20} />
        </div>
      </div>
    </div>
  );
}

interface ModeCardProps {
  mode: SessionMode;
  icon: LucideIcon;
  title: string;
  desc: string;
  meta?: string;
  accent?: boolean;
  disabled?: boolean;
  index: number;
}

function ModeCard({ mode, icon: Icon, title, desc, meta, accent, disabled, index }: ModeCardProps) {
  const { locale } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, type: "spring", stiffness: 260, damping: 26 }}
    >
      <Link
        href={`/play?mode=${mode}`}
        aria-disabled={disabled}
        className={clsx(
          "group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border p-5 transition",
          "hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-accent",
          accent
            ? "border-accent/40 bg-accent text-accent-ink shadow-lg shadow-accent/20"
            : "border-line bg-surface-solid hover:border-accent/50",
          disabled && "pointer-events-none opacity-55",
        )}
      >
        <span
          className={clsx(
            "grid size-11 place-items-center rounded-2xl",
            accent ? "bg-black/10" : "bg-accent/12 text-accent",
          )}
        >
          <Icon size={22} />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <p className={clsx("mt-1 text-sm", accent ? "opacity-80" : "text-muted")}>{desc}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs font-bold">
          <span className={accent ? "opacity-80" : "text-muted"}>{meta}</span>
          <ArrowRight
            size={18}
            className={clsx(
              "transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1",
              isRtl(locale) && "rotate-180",
            )}
          />
        </div>
      </Link>
    </motion.div>
  );
}

export function HomeScreen() {
  const { t, n, km } = useI18n();
  const hydrated = useHydrated();
  const settings = useSettings();
  const stats = useStats();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const today = hydrated ? stats.daily[todayKey()] : undefined;
  const reviewCount = useMemo(() => (hydrated ? reviewPool(stats.targets).length : 0), [hydrated, stats.targets]);
  const accuracy = stats.rounds ? Math.round((stats.correct / stats.rounds) * 100) : 0;
  const best = (m: SessionMode) =>
    hydrated && stats.bestScore[m] ? `${t("home.bestScore")} · ${n(stats.bestScore[m]!)}` : undefined;

  const highlightCodes = ["DZ", "DE", "JP", "BR", "NO", "AU", "KE"];

  return (
    <div className="graticule-bg min-h-full">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/stats" className={buttonClass("ghost", "sm")}>
            <BarChart3 size={17} />
            <span className="max-sm:hidden">{t("nav.stats")}</span>
          </Link>
          <LanguageSwitcher />
          <IconButton label={t("nav.settings")} onClick={() => setSettingsOpen(true)}>
            <Settings2 size={19} />
          </IconButton>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="grid items-center gap-10 py-8 md:grid-cols-[1.2fr_1fr] md:py-14">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5 flex -space-x-2 rtl:space-x-reverse">
              {highlightCodes.map((c) => (
                <Flag key={c} code={c} className="h-7 ring-2 ring-[var(--bg)]" />
              ))}
            </div>
            <h1 className="font-display text-5xl leading-[1.02] font-extrabold text-balance sm:text-6xl lg:text-7xl">
              {t("app.tagline")}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{t("app.subtitle")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {/* Le choix pays / capitales devient le mode de cible des parties suivantes. */}
              <Link
                href="/play?mode=classic"
                onClick={() => settings.set("mode", "country")}
                className={buttonClass("primary", "lg")}
              >
                <MapPin size={18} />
                {t("home.playCountries")}
              </Link>
              <Link
                href="/play?mode=classic"
                onClick={() => settings.set("mode", "capital")}
                className={buttonClass("primary", "lg")}
              >
                <Landmark size={18} />
                {t("home.playCapitals")}
              </Link>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex flex-wrap items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs text-muted transition hover:border-accent/50"
              >
                <Settings2 size={13} />
                <span className="font-bold text-ink">{t("home.rules")}</span>·
                <span>{t(`settings.mode.${settings.mode}`)}</span>·<span>{t(`zone.${settings.zone}`)}</span>·
                <span>
                  {settings.attempts} × {t("hud.attempts").toLowerCase()}
                </span>
                ·<span>± {km(settings.toleranceKm)}</span>
              </button>
            </div>
          </motion.div>
          <RoulettePreview />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ModeCard
            index={0}
            mode="classic"
            icon={Crosshair}
            accent
            title={t("mode.classic.title")}
            desc={t("mode.classic.desc", { n: settings.rounds })}
            meta={best("classic")}
          />
          <ModeCard
            index={1}
            mode="timeAttack"
            icon={Timer}
            title={t("mode.timeAttack.title")}
            desc={t("mode.timeAttack.desc")}
            meta={best("timeAttack")}
          />
          <ModeCard
            index={2}
            mode="daily"
            icon={CalendarDays}
            title={t("mode.daily.title")}
            desc={t("mode.daily.desc")}
            meta={today ? `${today.grid}` : todayKey()}
          />
          <ModeCard
            index={3}
            mode="review"
            icon={BookMarked}
            title={t("mode.review.title")}
            desc={t("mode.review.desc")}
            meta={reviewCount ? t("mode.review.count", { n: reviewCount }) : t("mode.review.empty")}
            disabled={hydrated && reviewCount === 0}
          />
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("home.bestScore"), value: n(Math.max(0, ...Object.values(stats.bestScore))) },
            { label: t("home.bestStreak"), value: n(stats.bestStreak) },
            { label: t("home.accuracy"), value: `${n(accuracy)} %` },
            { label: t("home.games"), value: n(stats.games) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="tabular font-display text-2xl font-extrabold">{hydrated ? s.value : "—"}</div>
            </div>
          ))}
        </section>

        <footer className="mt-12 text-center text-xs text-muted">{t("home.dataNote")}</footer>
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

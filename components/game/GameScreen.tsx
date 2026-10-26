"use client";

import { AnimatePresence } from "framer-motion";
import { BookMarked, CalendarCheck, Home } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { buttonClass } from "@/components/ui/controls";
import { Splash } from "@/components/ui/Splash";
import { targetLabel } from "@/lib/data/countries";
import { themesUseFeatures } from "@/lib/data/features";
import { reviewPool, todayKey } from "@/lib/game/engine";
import { loadFeatures } from "@/lib/geo/features";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SessionMode } from "@/lib/types";
import { useGame } from "@/store/game";
import { playableThemes, useSettings } from "@/store/settings";
import { useStats } from "@/store/stats";
import { useHydrated } from "@/store/useHydrated";
import { FeedbackToast } from "./FeedbackToast";
import { Hud } from "./Hud";
import { RoundResult } from "./RoundResult";
import { SessionSummary } from "./SessionSummary";
import { TargetCard } from "./TargetCard";

const GameMap = dynamic(() => import("@/components/map/GameMap"), { ssr: false });

const MODES: SessionMode[] = ["classic", "timeAttack", "daily", "review"];

type Status = "loading" | "playing" | "reviewEmpty" | "dailyDone";

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="graticule-bg grid min-h-full place-items-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface-solid p-6 text-center shadow-xl">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-accent/15 text-accent">{icon}</div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {children}
        <Link href="/" className={buttonClass("primary", "md", "mt-5 w-full")}>
          <Home size={16} />
          {t("summary.home")}
        </Link>
      </div>
    </main>
  );
}

export function GameScreen() {
  const { t, n, locale } = useI18n();
  const params = useSearchParams();
  const raw = params.get("mode") as SessionMode | null;
  const mode: SessionMode = raw && MODES.includes(raw) ? raw : "classic";
  const router = useRouter();
  // Mode choisi dans les paramètres, appliqué avec « Appliquer ».
  const [pendingMode, setPendingMode] = useState<SessionMode>(mode);

  const hydrated = useHydrated();
  const [restart, setRestart] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const storeThemes = playableThemes(useSettings((s) => s.themes));
  const globe = useSettings((s) => s.globe);
  const hotCold = useSettings((s) => s.hotCold);
  const daily = useStats((s) => s.daily[todayKey()]);
  const statTargets = useStats((s) => s.targets);

  const phase = useGame((s) => s.phase);
  const session = useGame((s) => s.session);
  const rules = useGame((s) => s.rules);
  const requested = useGame((s) => s.requested);
  const target = useGame((s) => s.target);
  const guesses = useGame((s) => s.guesses);
  const roundStatus = useGame((s) => s.roundStatus);
  const roundKey = useGame((s) => s.used.length);
  const guess = useGame((s) => s.guess);
  const tick = useGame((s) => s.tick);
  const nextRound = useGame((s) => s.nextRound);

  // Tracés nature : chargés avant la partie pour valider les clics dès le premier tour.
  // La révision peut reprendre n'importe quelle cible ratée. Une fois la partie lancée, seuls
  // ses thèmes comptent : modifier les paramètres ne la relance pas avant « Appliquer ».
  const themes = phase === "idle" ? storeThemes : requested.themes;
  const needsFeatures = hydrated && mode !== "daily" && (mode === "review" || themesUseFeatures(themes));
  const [featuresReady, setFeaturesReady] = useState(false);
  useEffect(() => {
    if (!needsFeatures) return;
    let cancelled = false;
    // En cas d'échec, la validation se rabat sur le point d'étiquette de chaque cible.
    loadFeatures()
      .catch(() => {})
      .then(() => !cancelled && setFeaturesReady(true));
    return () => {
      cancelled = true;
    };
  }, [needsFeatures]);
  const waiting = needsFeatures && !featuresReady;

  // --- Démarrage de la partie --------------------------------------------------
  useEffect(() => {
    if (!hydrated || waiting) return;
    if (mode === "daily" && useStats.getState().daily[todayKey()]) return;
    const s = useSettings.getState();
    useGame.getState().start(mode, {
      attempts: s.attempts,
      toleranceKm: s.toleranceKm,
      zone: s.zone,
      themes: playableThemes(s.themes),
      rounds: s.rounds,
    });
    return () => useGame.getState().reset();
  }, [hydrated, waiting, mode, restart]);

  // --- Contre-la-montre : décompte et enchaînement automatique ----------------------
  useEffect(() => {
    if (session !== "timeAttack" || phase !== "guessing") return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      tick(now - last);
      last = now;
    }, 100);
    return () => clearInterval(id);
  }, [session, phase, tick]);

  useEffect(() => {
    if (session !== "timeAttack" || phase !== "roundEnd") return;
    const id = setTimeout(nextRound, 1300);
    return () => clearTimeout(id);
  }, [session, phase, nextRound]);

  // « Rejouer » et « Appliquer » : nouvelle partie avec les paramètres actuels.
  // Les tracés nature sont chargés d'abord, pour ne pas relancer la partie une seconde fois.
  const relaunch = useCallback(async () => {
    setSettingsOpen(false);
    if (mode !== "daily" && themesUseFeatures(playableThemes(useSettings.getState().themes))) {
      await loadFeatures().catch(() => {});
      setFeaturesReady(true);
    }
    setRestart((k) => k + 1);
  }, [mode]);

  // Changement de mode : nouvelle URL, la partie redémarre avec le mode demandé.
  const apply = useCallback(() => {
    if (pendingMode === mode) return void relaunch();
    setSettingsOpen(false);
    router.push(`/play?mode=${pendingMode}`);
  }, [pendingMode, mode, relaunch, router]);

  const settings = useSettings();
  const rulesChanged =
    settings.attempts !== requested.attempts ||
    settings.toleranceKm !== requested.toleranceKm ||
    settings.zone !== requested.zone ||
    settings.rounds !== requested.rounds ||
    settings.themes.join() !== requested.themes.join();

  // Statut dérivé : une partie n'est jamais lancée dans ces deux cas (phase « idle »).
  const idle = phase === "idle";
  const status: Status = !hydrated || waiting
    ? "loading"
    : mode === "daily" && daily && idle
      ? "dailyDone"
      : mode === "review" && idle && reviewPool(statTargets).length === 0
        ? "reviewEmpty"
        : idle
          ? "loading"
          : "playing";

  if (status === "dailyDone" && daily) {
    return (
      <Notice icon={<CalendarCheck size={22} />} title={t("mode.daily.title")}>
        <p className="mt-2 text-sm text-muted">{t("mode.daily.done", { score: n(daily.score) })}</p>
        <p dir="ltr" className="mt-3 text-2xl tracking-[0.15em]">
          {daily.grid}
        </p>
      </Notice>
    );
  }
  if (status === "reviewEmpty") {
    return (
      <Notice icon={<BookMarked size={22} />} title={t("mode.review.title")}>
        <p className="mt-2 text-sm text-muted">{t("mode.review.empty")}</p>
      </Notice>
    );
  }
  if (status === "loading") return <Splash />;

  const showResult = phase === "roundEnd" && session !== "timeAttack";

  return (
    <main className="fixed inset-0 overflow-hidden bg-bg">
      <GameMap
        zone={rules.zone}
        globe={globe}
        interactive={phase === "guessing"}
        roundKey={roundKey}
        target={target}
        roundStatus={roundStatus}
        guesses={guesses}
        hotCold={hotCold}
        targetName={target ? targetLabel(target, locale) : ""}
        onPick={guess}
      />
      <Hud onOpenSettings={() => setSettingsOpen(true)} />
      <FeedbackToast />
      <LegalLinks className="pointer-events-auto absolute bottom-1.5 left-3 z-10 justify-start gap-x-3 text-[10px] opacity-60 transition-opacity hover:opacity-100 max-sm:hidden" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:p-5">
        <div className="pointer-events-auto flex w-full justify-center">
          <AnimatePresence mode="wait">
            {showResult ? (
              <RoundResult key="result" />
            ) : phase !== "finished" && phase !== "idle" ? (
              <TargetCard key="target" />
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {phase === "finished" && <SessionSummary onReplay={relaunch} />}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        rulesLocked={pendingMode === "daily"}
        onApply={apply}
        canApply={pendingMode !== mode || (pendingMode !== "daily" && rulesChanged)}
        mode={pendingMode}
        onModeChange={setPendingMode}
      />
    </main>
  );
}

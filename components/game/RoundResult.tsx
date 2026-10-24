"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp, Flag as FlagIcon, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/controls";
import { targetLabel } from "@/lib/data/countries";
import { isRtl } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGame } from "@/store/game";
import { FactCard } from "./FactCard";

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

function StatusBadge({ won, small = false }: { won: boolean; small?: boolean }) {
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center rounded-full text-white",
        small ? "size-7" : "size-9",
        won ? "bg-success" : "bg-reveal",
      )}
    >
      {won ? <Trophy size={small ? 14 : 18} /> : <FlagIcon size={small ? 14 : 18} />}
    </span>
  );
}

/**
 * Bilan d'un tour : statut, essais, distance, points, fiche pays et actions.
 * Il peut être réduit en une barre en bas de l'écran pour dégager la carte (utile sur mobile).
 */
export function RoundResult() {
  const { t, km, n, locale } = useI18n();
  const target = useGame((s) => s.target);
  const status = useGame((s) => s.roundStatus);
  const guesses = useGame((s) => s.guesses);
  const points = useGame((s) => s.roundPoints);
  const practice = useGame((s) => s.practice);
  const results = useGame((s) => s.results);
  const totalRounds = useGame((s) => s.totalRounds);
  const retryRound = useGame((s) => s.retryRound);
  const nextRound = useGame((s) => s.nextRound);
  const [collapsed, setCollapsed] = useState(false);
  const drag = useDragControls();

  if (!target) return null;
  const won = status === "won";
  const isLast = totalRounds !== null && results.length >= totalRounds;
  const best = Math.min(...guesses.map((g) => g.distanceKm));
  const label = targetLabel(target, locale);
  const nextLabel = isLast ? t("result.finish") : t("result.next");
  const arrow = <ArrowRight size={16} className={clsx(isRtl(locale) && "rotate-180")} />;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={SPRING}
      className="flex w-full max-w-3xl justify-center"
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.div
            key="bar"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={SPRING}
            className="glass flex w-full max-w-md items-center gap-2 rounded-full p-1.5 shadow-2xl"
          >
            <button
              onClick={() => setCollapsed(false)}
              aria-expanded={false}
              aria-label={t("result.expand")}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-full py-1 ps-1.5 pe-2 text-start transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <StatusBadge won={won} small />
              <span className="min-w-0 flex-1 truncate font-display text-base font-extrabold">{label}</span>
              <ChevronUp size={18} className="shrink-0 text-muted" />
            </button>
            <Button size="sm" onClick={nextRound} className="shrink-0">
              {nextLabel}
              {arrow}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={SPRING}
            // Glisser la poignée vers le bas réduit le bilan.
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 60 || info.velocity.y > 400) setCollapsed(true);
            }}
            className="glass relative w-full rounded-3xl shadow-2xl"
          >
            <div
              onPointerDown={(e) => drag.start(e)}
              className="flex touch-none justify-center pt-2 pb-1 md:hidden"
              aria-hidden
            >
              <span className="h-1.5 w-10 rounded-full bg-line" />
            </div>

            <div className="grid max-h-[62vh] gap-5 overflow-y-auto p-5 max-md:pt-2 md:grid-cols-[1fr_1.15fr]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <StatusBadge won={won} />
                  <div className="min-w-0 flex-1">
                    <div className={clsx("text-sm font-bold", won ? "text-success" : "text-reveal")}>
                      {won ? t("result.won") : t("result.lost")}
                    </div>
                    <div className="font-display text-2xl leading-tight font-extrabold">{label}</div>
                  </div>
                  <IconButton
                    label={t("result.collapse")}
                    aria-expanded
                    onClick={() => setCollapsed(true)}
                    className="shrink-0 self-start"
                  >
                    <ChevronDown size={20} />
                  </IconButton>
                </div>

                <ol className="space-y-1 text-sm">
                  {guesses.map((g, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5">
                      <span className="text-muted">{t("result.attempt", { n: i + 1 })}</span>
                      <span className={clsx("tabular font-bold", g.correct ? "text-success" : "text-ink")}>
                        {g.correct && g.distanceKm === 0
                          ? t(target.kind === "country" ? "result.inside" : "result.onTarget")
                          : km(g.distanceKm)}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted">{t("result.bestDistance", { km: km(best) })}</span>
                  {practice ? (
                    <span className="text-xs text-muted">{t("result.practice")}</span>
                  ) : (
                    <span className="tabular font-display text-2xl font-extrabold text-accent">
                      {t("unit.pts", { n: n(points) })}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Button variant="secondary" onClick={retryRound} className="flex-1 whitespace-nowrap">
                    <RotateCcw size={16} />
                    {t("result.retry")}
                  </Button>
                  <Button onClick={nextRound} className="flex-1 whitespace-nowrap" autoFocus>
                    {nextLabel}
                    {arrow}
                  </Button>
                </div>
              </div>

              <div className="border-line max-md:border-t max-md:pt-4 md:border-s md:ps-5">
                <FactCard target={target} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

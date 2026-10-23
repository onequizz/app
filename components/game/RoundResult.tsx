"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { ArrowRight, Flag as FlagIcon, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/controls";
import { targetLabel } from "@/lib/data/countries";
import { isRtl } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGame } from "@/store/game";
import { FactCard } from "./FactCard";

/** Bilan d'un tour : statut, essais, distance, points, fiche pays et actions. */
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

  if (!target) return null;
  const won = status === "won";
  const isLast = totalRounds !== null && results.length >= totalRounds;
  const best = Math.min(...guesses.map((g) => g.distanceKm));

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="glass grid max-h-[62vh] w-full max-w-3xl gap-5 overflow-y-auto rounded-3xl p-5 shadow-2xl md:grid-cols-[1fr_1.15fr]"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "grid size-9 place-items-center rounded-full text-white",
              won ? "bg-success" : "bg-reveal",
            )}
          >
            {won ? <Trophy size={18} /> : <FlagIcon size={18} />}
          </span>
          <div>
            <div className={clsx("text-sm font-bold", won ? "text-success" : "text-reveal")}>
              {won ? t("result.won") : t("result.lost")}
            </div>
            <div className="font-display text-2xl leading-tight font-extrabold">
              {targetLabel(target, locale)}
            </div>
          </div>
        </div>

        <ol className="space-y-1 text-sm">
          {guesses.map((g, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5">
              <span className="text-muted">{t("result.attempt", { n: i + 1 })}</span>
              <span className={clsx("tabular font-bold", g.correct ? "text-success" : "text-ink")}>
                {g.correct && g.distanceKm === 0 ? t("result.inside") : km(g.distanceKm)}
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
          <Button variant="secondary" onClick={retryRound} className="flex-1">
            <RotateCcw size={16} />
            {t("result.retry")}
          </Button>
          <Button onClick={nextRound} className="flex-1" autoFocus>
            {isLast ? t("result.finish") : t("result.next")}
            <ArrowRight size={16} className={clsx(isRtl(locale) && "rotate-180")} />
          </Button>
        </div>
      </div>

      <div className="border-line max-md:border-t max-md:pt-4 md:border-s md:ps-5">
        <FactCard code={target.code} />
      </div>
    </motion.div>
  );
}

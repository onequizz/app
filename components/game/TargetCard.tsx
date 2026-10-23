"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, MousePointerClick } from "lucide-react";
import { Flag } from "@/components/ui/Flag";
import { getCountry } from "@/lib/data/countries";
import { HINT_COUNT } from "@/lib/game/engine";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGame } from "@/store/game";
import { TargetRoulette } from "./TargetRoulette";

function AttemptDots({ total, used }: { total: number; used: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${total - used}/${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.span
          key={i}
          animate={{ scale: i < used ? 0.8 : 1 }}
          className={clsx("size-2.5 rounded-full", i < used ? "bg-danger" : "bg-accent")}
        />
      ))}
    </div>
  );
}

function HintChips() {
  const { t, n, locale } = useI18n();
  const target = useGame((s) => s.target);
  const hints = useGame((s) => s.hints);
  if (!target || hints === 0) return null;
  const c = getCountry(target.code);

  const chips = [
    { key: "region", label: t("hint.region"), value: t(`zone.${c.region}`) },
    {
      key: "flag",
      label: t("hint.flag"),
      value: <Flag code={c.code} className="h-5" />,
    },
    {
      key: "population",
      label: t("hint.population"),
      value: c.population ? n(c.population, { notation: "compact", maximumFractionDigits: 1 }) : "—",
    },
    target.kind === "capital"
      ? { key: "country", label: t("hint.country"), value: c.names[locale] }
      : { key: "capital", label: t("hint.capital"), value: c.capital?.names[locale] ?? "—" },
  ].slice(0, hints);

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      <AnimatePresence initial={false}>
        {chips.map((chip) => (
          <motion.span
            key={chip.key}
            initial={{ opacity: 0, scale: 0.8, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs"
          >
            <span className="text-muted">{chip.label}</span>
            <span className="font-bold">{chip.value}</span>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function TargetCard() {
  const { t } = useI18n();
  const target = useGame((s) => s.target);
  const phase = useGame((s) => s.phase);
  const rules = useGame((s) => s.rules);
  const session = useGame((s) => s.session);
  const guesses = useGame((s) => s.guesses);
  const hints = useGame((s) => s.hints);
  const spinDone = useGame((s) => s.spinDone);
  const takeHint = useGame((s) => s.takeHint);

  if (!target) return null;
  const spinning = phase === "spinning";
  const prompt = target.kind === "capital" ? t("target.findCapital") : t("target.findCountry");

  return (
    <motion.div
      layout
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="glass w-full max-w-xl rounded-3xl px-5 pt-4 pb-4 shadow-2xl"
    >
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold tracking-wide uppercase">
        <AnimatePresence mode="wait">
          <motion.span
            key={spinning ? "drawing" : prompt}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={spinning ? "text-muted" : "text-accent"}
          >
            {spinning ? t("target.drawing") : prompt}
          </motion.span>
        </AnimatePresence>
        <AttemptDots total={rules.attempts} used={guesses.length} />
      </div>

      <TargetRoulette
        target={target}
        zone={rules.zone}
        mode={rules.mode}
        fast={session === "timeAttack"}
        spinning={spinning}
        onDone={spinDone}
      />

      <div className="mt-2 flex flex-col items-center gap-2">
        <HintChips />
        <div className="flex w-full items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <MousePointerClick size={14} />
            {t("target.clickMap")}
          </span>
          <button
            onClick={takeHint}
            disabled={phase !== "guessing" || hints >= HINT_COUNT}
            title={t("hint.cost")}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold transition hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-inherit"
          >
            <Lightbulb size={14} />
            {t("hint.button")} {hints}/{HINT_COUNT}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

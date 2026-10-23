"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Crosshair, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { HEAT_COLORS, heatOf } from "@/lib/game/engine";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGame, type GameEvent } from "@/store/game";
import { useSettings } from "@/store/settings";

/** Bulle de feedback après chaque clic, et explosion de points/combo. */
export function FeedbackToast() {
  const { t, km, n } = useI18n();
  const event = useGame((s) => s.event);
  const practice = useGame((s) => s.practice);
  const hotCold = useSettings((s) => s.hotCold);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const visible: GameEvent | null = event && event.id !== dismissed ? event : null;

  useEffect(() => {
    if (!event) return;
    const id = setTimeout(() => setDismissed(event.id), event.type === "miss" ? 2200 : 1800);
    return () => clearTimeout(id);
  }, [event]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex flex-col items-center gap-2 px-4">
      <AnimatePresence mode="popLayout">
        {visible && visible.type === "miss" && (
          <motion.div
            key={visible.id}
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: [0, -8, 8, -5, 5, 0] }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ x: { duration: 0.4 } }}
            className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-xl"
          >
            <Crosshair size={20} style={{ color: hotCold ? HEAT_COLORS[heatOf(visible.distanceKm)] : "var(--danger)" }} />
            <div>
              <div className="font-bold">
                {t("feedback.miss", { km: km(visible.distanceKm) })}
                {hotCold && (
                  <span
                    className="ms-2 rounded-md px-1.5 py-0.5 text-xs text-white"
                    style={{ background: HEAT_COLORS[heatOf(visible.distanceKm)] }}
                  >
                    {t(`heat.${heatOf(visible.distanceKm)}`)}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted">{t("feedback.attemptsLeft", { n: visible.attemptsLeft })}</div>
            </div>
          </motion.div>
        )}

        {visible && visible.type === "won" && (
          <motion.div
            key={visible.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-success px-4 py-2 font-bold text-white shadow-xl">
              <CheckCircle2 size={20} />
              {visible.distanceKm === 0 ? t("feedback.inside") : t("feedback.correct")}
            </div>
            {!practice && visible.points > 0 && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mt-2 font-display text-4xl font-extrabold text-accent drop-shadow-[0_2px_8px_rgb(0_0_0/0.35)]"
              >
                +{n(visible.points)}
                {visible.multiplier > 1 && (
                  <span className="ms-2 align-middle text-lg">{t("result.combo", { x: visible.multiplier })}</span>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {visible && visible.type === "lost" && (
          <motion.div
            key={visible.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-2xl bg-reveal px-4 py-2 font-bold text-white shadow-xl"
          >
            <XCircle size={20} />
            {t("result.lost")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

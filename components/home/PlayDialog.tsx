"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Play, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ModePicker, modeUsesThemes } from "@/components/settings/ModePicker";
import { RulesFields } from "@/components/settings/RulesFields";
import { Button, Field } from "@/components/ui/controls";
import { Modal } from "@/components/ui/Modal";
import { ThemePicker } from "@/components/ui/ThemePicker";
import { targetPool } from "@/lib/data/countries";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SessionMode } from "@/lib/types";
import { useSettings } from "@/store/settings";

/** Lancement d'une partie : choix des thèmes, puis paramètres repliables. */
export function PlayDialog({
  mode,
  onClose,
}: {
  /** Mode proposé à l'ouverture (modifiable dans les paramètres) ; null = fenêtre fermée. */
  mode: SessionMode | null;
  onClose: () => void;
}) {
  const { t, n, km } = useI18n();
  const router = useRouter();
  const s = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panelId = useId();

  // Mode choisi : repart du mode proposé à chaque ouverture.
  const [chosen, setChosen] = useState<SessionMode>(mode ?? "classic");
  const [openedWith, setOpenedWith] = useState(mode);
  if (mode !== openedWith) {
    setOpenedWith(mode);
    if (mode) setChosen(mode);
  }
  const usesThemes = modeUsesThemes(chosen);
  const daily = chosen === "daily";

  const count = targetPool(s.zone, s.themes).length;
  const ready = !usesThemes || s.themes.length > 0;

  const start = () => {
    if (!mode || !ready) return;
    router.push(`/play?mode=${chosen}`);
  };

  return (
    <Modal
      open={mode !== null}
      onClose={onClose}
      title={t("home.quizTitle")}
      subtitle={t("play.help")}
      footer={
        <div className="flex flex-col items-stretch gap-2">
          {!ready && <p className="text-center text-xs font-semibold text-accent">{t("settings.atLeastOne")}</p>}
          {!usesThemes && (
            <p className="text-center text-xs text-muted">
              {daily ? t("settings.dailyLocked") : t("mode.review.desc")}
            </p>
          )}
          <Button size="lg" disabled={!ready} onClick={start}>
            <Play size={18} />
            {t("play.start")}
            {usesThemes && ready && (
              <span className="tabular rounded-full bg-black/10 px-2 py-0.5 text-xs">
                {t("home.targetsInPlay", { n: n(count) })}
              </span>
            )}
          </Button>
        </div>
      }
    >
      <ThemePicker zone={s.zone} hint={false} disabled={!usesThemes} />

      <div className="mt-3 rounded-2xl border border-line">
        <button
          type="button"
          aria-expanded={settingsOpen}
          aria-controls={panelId}
          onClick={() => setSettingsOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <SlidersHorizontal size={18} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{t("play.settings")}</span>
            <span className="block truncate text-xs text-muted">
              <span className="font-bold text-ink">{t(`mode.${chosen}.title`)}</span>
              {!daily && (
                <>
                  {" "}
                  · {t(`zone.${s.zone}`)} · {s.attempts} × {t("hud.attempts").toLowerCase()} · ± {km(s.toleranceKm)}
                  {chosen !== "timeAttack" && (
                    <>
                      {" "}
                      · {t("settings.rounds").toLowerCase()} : {s.rounds}
                    </>
                  )}
                </>
              )}
            </span>
          </span>
          <ChevronDown
            size={18}
            className={clsx("shrink-0 text-muted transition-transform", settingsOpen && "rotate-180")}
          />
        </button>
        <AnimatePresence initial={false}>
          {settingsOpen && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="overflow-hidden"
            >
              <div className="space-y-6 border-t border-line px-4 pt-4 pb-5">
                <Field label={t("settings.gameMode")}>
                  <ModePicker value={chosen} onChange={setChosen} />
                </Field>
                <RulesFields disabled={daily} mode={chosen} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Settings2, Timer, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { IconButton } from "@/components/ui/controls";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";
import { comboMultiplier, TIME_ATTACK } from "@/lib/game/engine";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGame } from "@/store/game";
import { useSettings } from "@/store/settings";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-2 sm:px-3">
      <span className="text-[10px] font-bold tracking-wider text-muted uppercase">{label}</span>
      <span className="tabular font-display text-lg leading-tight font-extrabold sm:text-xl">{children}</span>
    </div>
  );
}

export function Hud({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { t, n } = useI18n();
  const score = useGame((s) => s.score);
  const streak = useGame((s) => s.streak);
  const results = useGame((s) => s.results);
  const totalRounds = useGame((s) => s.totalRounds);
  const session = useGame((s) => s.session);
  const timeLeftMs = useGame((s) => s.timeLeftMs);
  const sound = useSettings((s) => s.sound);
  const setSetting = useSettings((s) => s.set);

  const mult = comboMultiplier(streak);
  const seconds = Math.ceil(timeLeftMs / 1000);
  const timeRatio = Math.min(1, timeLeftMs / TIME_ATTACK.startMs);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
      <Link
        href="/"
        className="glass pointer-events-auto flex h-12 items-center rounded-full px-4 shadow-lg"
        aria-label={t("nav.home")}
      >
        <Logo size="sm" className="max-sm:[&>span]:hidden" />
      </Link>

      <div className="glass pointer-events-auto relative flex h-14 items-center overflow-hidden rounded-full px-2 shadow-lg">
        {session === "timeAttack" ? (
          <Stat label={t("hud.time")}>
            <span className={clsx("inline-flex items-center gap-1", seconds <= 10 && "text-danger")}>
              <Timer size={16} />
              {t("unit.sec", { n: seconds })}
            </span>
          </Stat>
        ) : (
          <Stat label={t("hud.round")}>
            {n(Math.min(results.length + 1, totalRounds ?? Infinity))}
            <span className="text-sm text-muted">/{totalRounds}</span>
          </Stat>
        )}
        <span className="h-7 w-px bg-line" />
        <Stat label={t("hud.score")}>
          <motion.span key={score} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="inline-block">
            {n(score)}
          </motion.span>
        </Stat>
        <span className="h-7 w-px bg-line" />
        <Stat label={t("hud.streak")}>
          <span className="inline-flex items-center gap-1">
            <Flame
              size={17}
              className={clsx(
                "transition-colors",
                streak >= 3 ? "fill-accent text-accent" : streak > 0 ? "text-accent" : "text-muted",
              )}
            />
            {n(streak)}
            <AnimatePresence>
              {mult > 1 && (
                <motion.span
                  key={mult}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className="ms-1 rounded-md bg-accent px-1.5 text-xs text-accent-ink"
                >
                  ×{mult}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </Stat>
        {session === "timeAttack" && (
          <span
            className="absolute inset-x-0 bottom-0 h-1 origin-left bg-accent transition-transform duration-200 rtl:origin-right"
            style={{ transform: `scaleX(${timeRatio})` }}
          />
        )}
      </div>

      <div className="glass pointer-events-auto flex h-12 items-center gap-0.5 rounded-full px-1 shadow-lg">
        <LanguageSwitcher />
        <IconButton label={t("common.sound")} onClick={() => setSetting("sound", !sound)} className="max-sm:hidden">
          {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </IconButton>
        <IconButton label={t("nav.settings")} onClick={onOpenSettings}>
          <Settings2 size={19} />
        </IconButton>
      </div>
    </header>
  );
}

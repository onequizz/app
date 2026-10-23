"use client";

import { motion } from "framer-motion";
import { BookMarked, Check, Home, RotateCcw, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/controls";
import { resultEmoji } from "@/lib/game/engine";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGame } from "@/store/game";

export function SessionSummary({ onReplay }: { onReplay: () => void }) {
  const { t, n } = useI18n();
  const s = useGame();
  const [copied, setCopied] = useState(false);

  const correct = s.results.filter((r) => r.status === "won").length;
  const grid = s.results.map(resultEmoji).join("");
  const missed = s.results.some((r) => r.status === "lost");

  const share = async () => {
    const text = `OneQuizz 🌍 ${s.dailyDate ?? ""}\n${grid}\n${correct}/${s.results.length} · ${s.score} pts`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {
      await navigator.clipboard?.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4">
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="w-full max-w-md rounded-3xl border border-line bg-surface-solid p-6 text-center shadow-2xl"
      >
        <p className="text-sm font-bold text-muted">
          {s.session === "timeAttack" ? t("summary.timeUp") : t("summary.title")}
        </p>
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
          className="tabular my-2 font-display text-6xl font-extrabold text-accent"
        >
          {n(s.score)}
        </motion.div>
        {s.newRecord && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent"
          >
            <Sparkles size={15} /> {t("summary.newRecord")}
          </motion.p>
        )}

        <div className="my-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface-2 p-3">
            <div className="text-xs text-muted">{t("summary.correct")}</div>
            <div className="tabular font-display text-2xl font-bold">
              {n(correct)}/{n(s.results.length)}
            </div>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3">
            <div className="text-xs text-muted">{t("summary.bestStreak")}</div>
            <div className="tabular font-display text-2xl font-bold">{n(s.bestStreak)}</div>
          </div>
        </div>

        {grid && (
          <p dir="ltr" className="mb-4 text-2xl tracking-[0.15em] break-all">
            {grid}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {s.session === "daily" ? (
            <Button onClick={share}>
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? t("summary.copied") : t("summary.share")}
            </Button>
          ) : (
            <Button onClick={onReplay}>
              <RotateCcw size={16} />
              {t("summary.playAgain")}
            </Button>
          )}
          {missed && s.session !== "daily" && (
            <Link href="/play?mode=review" className={buttonClass("secondary")}>
              <BookMarked size={16} />
              {t("summary.review")}
            </Link>
          )}
          <Link href="/" className={buttonClass("ghost")}>
            <Home size={16} />
            {t("summary.home")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

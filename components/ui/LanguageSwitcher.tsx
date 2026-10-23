"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("settings.language")}
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
      >
        <Languages size={18} />
        <span className="uppercase">{locale}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 top-12 z-50 min-w-40 overflow-hidden rounded-2xl border border-line bg-surface-solid p-1 shadow-xl"
          >
            {LOCALES.map((l) => (
              <li key={l}>
                <button
                  lang={l}
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm transition hover:bg-surface-2",
                    l === locale && "font-bold text-accent",
                  )}
                >
                  {LOCALE_LABELS[l]}
                  {l === locale && <Check size={16} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

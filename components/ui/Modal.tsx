"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { IconButton } from "./controls";

/** Fenêtre modale : feuille en bas d'écran sur mobile, centrée à partir de « sm ». */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Zone fixe sous le contenu défilant (actions). */
  footer?: ReactNode;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-line bg-surface-solid shadow-2xl sm:max-h-[86dvh] sm:rounded-3xl"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6">
              <div>
                <h2 className="font-display text-2xl font-extrabold">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
              </div>
              <IconButton label={t("common.close")} onClick={onClose} className="-me-2 shrink-0">
                <X size={20} />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
            {footer && <footer className="border-t border-line px-5 py-4 sm:px-6">{footer}</footer>}
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

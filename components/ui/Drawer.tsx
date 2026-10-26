"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { isRtl } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { IconButton } from "./controls";

/** Panneau latéral (côté « fin » de lecture : droite en LTR, gauche en RTL). */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Zone fixe sous le contenu défilant (actions). */
  footer?: ReactNode;
}) {
  const { t, locale } = useI18n();
  const offset = isRtl(locale) ? "-100%" : "100%";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-s border-line bg-surface-solid shadow-2xl"
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: offset }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <IconButton label={t("common.close")} onClick={onClose}>
                <X size={20} />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <footer className="border-t border-line px-5 py-4">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

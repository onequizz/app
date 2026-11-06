"use client";

import clsx from "clsx";
import Link from "next/link";
import { LEGAL_DOCS } from "@/lib/legal/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** Liens vers les pages légales (pieds de page, paramètres). */
export function LegalLinks({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <nav className={clsx("flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted", className)}>
      {LEGAL_DOCS.map((doc) => (
        <Link key={doc} href={`/legal/${doc}`} className="hover:text-ink hover:underline">
          {t(`legal.${doc}`)}
        </Link>
      ))}
    </nav>
  );
}

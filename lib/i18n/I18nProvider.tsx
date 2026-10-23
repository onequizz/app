"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { intlLocale, isRtl, LOCALE_COOKIE, type Locale } from "./config";
import { fr, type MessageKey } from "./messages/fr";
import { en } from "./messages/en";
import { ar } from "./messages/ar";
import { es } from "./messages/es";

const MESSAGES = { fr, en, ar, es } as const;

type Vars = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Formate un nombre selon la langue (chiffres latins en arabe). */
  n: (value: number, opts?: Intl.NumberFormatOptions) => string;
  /** Distance en km, formatée et localisée. */
  km: (value: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    document.documentElement.dir = isRtl(l) ? "rtl" : "ltr";
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = MESSAGES[locale];
    const nf = new Intl.NumberFormat(intlLocale(locale));
    const t = (key: MessageKey, vars?: Vars) => {
      let s: string = dict[key] ?? fr[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    };
    const n = (value: number, opts?: Intl.NumberFormatOptions) =>
      opts ? new Intl.NumberFormat(intlLocale(locale), opts).format(value) : nf.format(value);
    const km = (value: number) =>
      t("unit.km", { n: n(Math.round(value)) });
    return { locale, setLocale, t, n, km };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  return ctx;
}

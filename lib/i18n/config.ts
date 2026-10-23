export const LOCALES = ["fr", "en", "ar", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "oq-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  es: "Español",
};

export const isRtl = (l: Locale) => l === "ar";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Les nombres restent en chiffres latins, y compris en arabe (usage courant au Maghreb). */
export function intlLocale(l: Locale): string {
  return l === "ar" ? "ar-u-nu-latn" : l;
}

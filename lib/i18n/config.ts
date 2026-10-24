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

/**
 * Première langue prise en charge parmi les préférences du navigateur
 * (en-tête Accept-Language ou navigator.languages), sinon la langue par défaut.
 */
export function negotiateLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const base = tag.trim().split(/[-_;]/)[0].toLowerCase();
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Langues d'un en-tête Accept-Language, de la plus à la moins souhaitée. */
export function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag, q: q ? Number(q) : 1 };
    })
    .filter((l) => l.tag && l.q > 0)
    .sort((a, b) => b.q - a.q)
    .map((l) => l.tag);
}

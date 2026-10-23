import { COUNTRIES } from "@/lib/data/countries";
import { isLocale, type Locale } from "@/lib/i18n/config";

interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string } };
}

const WEEK = 60 * 60 * 24 * 7;

async function fetchSummary(lang: Locale, title: string): Promise<WikiSummary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "OneQuizz/0.1 (educational geography game)", Accept: "application/json" },
    next: { revalidate: WEEK },
  });
  if (!res.ok) return null;
  return (await res.json()) as WikiSummary;
}

/** Résumé Wikipédia d'un pays dans la langue demandée (repli sur l'anglais). */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const country = COUNTRIES.find((c) => c.code === code.toUpperCase());
  if (!country) return Response.json({ error: "unknown country" }, { status: 404 });

  const requested = new URL(request.url).searchParams.get("lang");
  const lang: Locale = isLocale(requested) ? requested : "en";

  const tries: [Locale, string][] = [];
  if (country.wiki[lang]) tries.push([lang, country.wiki[lang]!]);
  if (lang !== "en" && country.wiki.en) tries.push(["en", country.wiki.en]);

  for (const [l, title] of tries) {
    try {
      const s = await fetchSummary(l, title);
      if (s?.extract) {
        return Response.json(
          {
            title: s.title,
            extract: s.extract,
            thumbnail: s.thumbnail?.source ?? null,
            url: s.content_urls?.desktop?.page ?? `https://${l}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
            lang: l,
          },
          { headers: { "Cache-Control": `public, max-age=86400, stale-while-revalidate=${WEEK}` } },
        );
      }
    } catch {
      // On essaie la langue suivante.
    }
  }
  return Response.json({ error: "unavailable" }, { status: 502 });
}

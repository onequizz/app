import { COUNTRIES } from "@/lib/data/countries";
import { findFeature } from "@/lib/data/features";
import { isLocale, type Locale } from "@/lib/i18n/config";

interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string } };
}

const WEEK = 60 * 60 * 24 * 7;

const articleUrl = (lang: Locale, title: string) =>
  `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;

/**
 * Résumé Wikipédia, en réessayant quand Wikipédia limite le débit (429) ou flanche (5xx).
 * Renvoie null si l'article n'a pas de résumé, et lève une erreur si le service reste indisponible.
 */
async function fetchSummary(lang: Locale, title: string): Promise<WikiSummary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "OneQuizz/0.1 (educational geography game)", Accept: "application/json" },
      next: { revalidate: WEEK },
    });
    if (res.ok) return (await res.json()) as WikiSummary;
    if (res.status === 404) return null;
    if (res.status !== 429 && res.status < 500) throw new Error(`Wikipédia ${res.status}`);
    await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
  }
  throw new Error("Wikipédia indisponible");
}

/**
 * Résumé Wikipédia d'un pays ou d'une cible nature, uniquement dans la langue demandée :
 * jamais de texte dans une autre langue. Sans article dans cette langue, on renvoie le lien
 * vers l'article anglais (404 « missing ») ; en cas de panne passagère, rien n'est mis en cache.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const entry = COUNTRIES.find((c) => c.code === code.toUpperCase()) ?? findFeature(code.toUpperCase());
  if (!entry) return Response.json({ error: "unknown target" }, { status: 404 });

  const requested = new URL(request.url).searchParams.get("lang");
  const lang: Locale = isLocale(requested) ? requested : "en";
  const title = entry.wiki[lang];
  const missing = () =>
    Response.json(
      { error: "missing", url: entry.wiki.en ? articleUrl("en", entry.wiki.en) : null },
      { status: 404, headers: { "Cache-Control": `public, max-age=86400, stale-while-revalidate=${WEEK}` } },
    );
  if (!title) return missing();

  try {
    const s = await fetchSummary(lang, title);
    if (!s?.extract) return missing();
    return Response.json(
      {
        title: s.title,
        extract: s.extract,
        thumbnail: s.thumbnail?.source ?? null,
        url: s.content_urls?.desktop?.page ?? articleUrl(lang, title),
        lang,
      },
      { headers: { "Cache-Control": `public, max-age=86400, stale-while-revalidate=${WEEK}` } },
    );
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

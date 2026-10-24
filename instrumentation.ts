const PING_INTERVAL = 10 * 60 * 1000;

/**
 * Sur l'offre gratuite de Render, le service s'endort après 15 minutes sans
 * trafic entrant. On s'appelle soi-même toutes les 10 minutes via l'URL
 * publique (RENDER_EXTERNAL_URL, fournie par Render) pour rester éveillé.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const baseUrl = process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) return;

  setInterval(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
      if (!res.ok) console.warn(`[keep-alive] ping ${res.status}`);
    } catch (error) {
      console.warn("[keep-alive] ping échoué", error);
    }
  }, PING_INTERVAL);
}

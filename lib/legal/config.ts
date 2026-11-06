/**
 * Informations de l'éditeur reprises dans les pages légales.
 * Les valeurs entre crochets sont à compléter avant la mise en ligne.
 */
export const LEGAL_INFO = {
  /** Nom de la personne ou raison sociale de la société qui édite le site. */
  publisher: "[Nom de l'éditeur à compléter]",
  /** Adresse e-mail de contact (questions, exercice des droits). */
  contact: "[adresse e-mail à compléter]",
  /** Pays dont le droit s'applique aux conditions d'utilisation (« la France »…). */
  jurisdiction: "[pays à compléter]",
  host: {
    name: "Render Services, Inc.",
    address: "525 Brannan Street, Suite 300, San Francisco, CA 94107, USA",
    url: "https://render.com",
  },
  /** Date de dernière mise à jour des textes (AAAA-MM-JJ). */
  updated: "2026-10-26",
};

export const LEGAL_DOCS = ["notice", "terms", "privacy", "cookies"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

export const isLegalDoc = (v: string): v is LegalDoc => (LEGAL_DOCS as readonly string[]).includes(v);

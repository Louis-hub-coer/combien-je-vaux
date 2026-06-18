/**
 * Normalisation partagée. DOIT être identique à l'indexation et à la requête,
 * sinon les correspondances échouent.
 */

/** minuscule, sans accents, alphanumérique, espaces compactés. */
export function normalizeText(input: string): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Préfixes de requête courants à retirer ("salaire de…", "combien gagne…").
const LEAD = /^(salaires?|combien gagnent?|paye|paie)\s+(de\s+|du\s+|des\s+|la\s+|le\s+|les\s+|d\s+)?/;

/** Normalise + retire un éventuel préfixe interrogatif. */
export function normalizeQuery(q: string): string {
  const base = normalizeText(q);
  const stripped = base.replace(LEAD, "").trim();
  return stripped.length >= 2 ? stripped : base;
}

export function tokenize(s: string): string[] {
  return s ? s.split(" ").filter(Boolean) : [];
}

/** Ensemble de trigrammes (pour le repli flou). */
export function trigrams(s: string): Set<string> {
  const t = `  ${s} `;
  const g = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) g.add(t.slice(i, i + 3));
  return g;
}

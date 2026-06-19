/**
 * Garde-fou requêtes offensantes.
 *
 * Objectif : ne JAMAIS rediriger une insulte / un terme sexuel dégradant / une
 * injure vers une personne réelle ou une fiche. La détection se fait sur des
 * TOKENS EXACTS (après normalisation sans accents) pour éviter les faux positifs
 * (ex. « réputation » contient « pute » en sous-chaîne mais n'est PAS bloqué).
 *
 * La liste est volontairement ciblée et non exhaustive. Les termes choisis ne
 * collisionnent pas avec des intitulés de métier / noms courants.
 */

// Tokens (déjà normalisés : minuscule, sans accents). Comparaison par égalité stricte.
const BLOCKED_TOKENS = new Set<string>([
  // insultes vulgaires visant une personne
  "connard", "connards", "connasse", "connasses", "conasse", "conard",
  "salaud", "salauds", "salopard", "salopards", "enfoire", "enfoires",
  "batard", "batards", "abruti", "abrutie", "abrutis",
  // termes sexuels dégradants / visant une personne
  "pute", "putes", "putain", "putains", "putes",
  "salope", "salopes", "petasse", "petasses", "pouffiasse", "pouffiasses",
  "poufiasse", "poufiasses", "grognasse", "grognasses", "catin", "catins",
  "morue",
  // actes / vulgarités sexuelles explicites
  "encule", "encules", "enculee", "enculer", "enculeur", "encules",
  "nique", "niquer", "niquee", "niqueur", "niques",
  "bite", "bites", "couille", "couilles", "zboub", "teub", "chibre", "nichon", "nichons", "branleur", "branleuse",
  // insultes homophobes
  "pede", "pedes", "pedale", "pedales", "tapette", "tapettes",
  "tarlouze", "tarlouzes", "gouine", "gouines", "fiotte", "fiottes",
  // insultes racistes
  "negre", "negres", "negresse", "negresses", "bougnoule", "bougnoules",
  "bicot", "bicots", "youpin", "youpins", "feuj", "feujs",
  "chinetoque", "chinetoques", "bamboula", "niakoue", "niakoues",
  // acronymes injurieux courants
  "fdp", "ntm", "tg", "ntm",
  // contenus explicites
  "porn", "porno", "pornos",
]);

// Expressions (sous-chaîne sur la requête normalisée). Pour les cas multi-mots
// dont les tokens isolés seraient légitimes (ex. « gueule »).
const BLOCKED_PHRASES = ["ta gueule", "ferme ta gueule", "ta mere la"];

/** true si la requête (normalisée) doit être bloquée (pas de résultat, pas de fuzzy). */
export function isBlockedQuery(normalizedQuery: string): boolean {
  const nq = (normalizedQuery ?? "").trim();
  if (!nq) return false;
  for (const t of nq.split(" ")) {
    if (t && BLOCKED_TOKENS.has(t)) return true;
  }
  for (const p of BLOCKED_PHRASES) {
    if (nq.includes(p)) return true;
  }
  return false;
}

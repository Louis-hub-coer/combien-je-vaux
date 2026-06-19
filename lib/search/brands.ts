/**
 * Inférence « entreprise -> métiers représentatifs ».
 *
 * Quand l'utilisateur tape UNIQUEMENT un nom d'entreprise, on n'affiche pas un
 * résultat arbitraire : on ouvre le métier le plus représentatif (best) et on
 * propose les autres métiers associés en résultats proches. L'affichage reste
 * 100 % générique (jamais la marque dans le titre).
 *
 * Les intitulés ci-dessous existent tels quels dans le CSV (résolus par égalité
 * normalisée côté moteur). Aucune dépendance serveur ici (module pur).
 */

export interface BrandHint {
  label: string;       // libellé d'affichage de l'entreprise (ex. "Goldman Sachs")
  sectorKey: string;   // secteur associé (clé de la grille « Explorer par secteur »)
  metiers: string[];   // métiers représentatifs (le 1er = best)
  re: RegExp;          // regex ayant matché (sert à retirer la marque de la requête)
}

// Jeux de métiers réutilisables (ordre = pertinence ; le 1er sert de best par défaut).
const FINANCE_TRADING = ["Trader", "Sales BFI", "Analyste M&A", "Structureur", "Gérant de portefeuille", "Chargé d'affaires Private Equity"];
const FINANCE_MA = ["Analyste M&A", "Trader", "Sales BFI", "Structureur", "Chargé d'affaires Private Equity", "Gérant de portefeuille"];
const FINANCE_AM = ["Gérant de portefeuille", "Analyste M&A", "Sales BFI", "Trader", "Structureur"];
const TECH = ["Data scientist", "Ingénieur logiciel", "Product manager", "Machine learning engineer", "CTO"];
const RAIL = ["Contrôleur SNCF", "Conducteur de train", "Agent d'escale"];
const LUXE = ["Responsable marketing", "Directeur commercial", "Acheteur", "Responsable de magasin", "Responsable e-commerce"];

// Entrées ordonnées : phrases spécifiques avant tokens génériques.
const BRANDS: { re: RegExp; label: string; sectorKey: string; metiers: string[] }[] = [
  // — Banques d'affaires anglo-saxonnes / américaines —
  { re: /morgan stanley/, label: "Morgan Stanley", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /jp ?morgan|j p morgan|jpmorgan/, label: "J.P. Morgan", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /goldman|sachs/, label: "Goldman Sachs", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /bofa|bank of america|merrill/, label: "Bank of America", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /citigroup|\bciti\b/, label: "Citi", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /barclays/, label: "Barclays", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /\bubs\b|credit suisse/, label: "UBS", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /deutsche bank|deutsche/, label: "Deutsche Bank", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /\bhsbc\b/, label: "HSBC", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /nomura/, label: "Nomura", sectorKey: "finance", metiers: FINANCE_TRADING },
  // — Boutiques M&A (best = Analyste M&A) —
  { re: /lazard/, label: "Lazard", sectorKey: "finance", metiers: FINANCE_MA },
  { re: /rothschild/, label: "Rothschild", sectorKey: "finance", metiers: FINANCE_MA },
  { re: /jefferies/, label: "Jefferies", sectorKey: "finance", metiers: FINANCE_MA },
  { re: /moelis/, label: "Moelis", sectorKey: "finance", metiers: FINANCE_MA },
  { re: /evercore/, label: "Evercore", sectorKey: "finance", metiers: FINANCE_MA },
  // — Private equity (best = PE) —
  { re: /blackstone|\bkkr\b|carlyle/, label: "Private equity", sectorKey: "finance", metiers: ["Chargé d'affaires Private Equity", "Analyste M&A", "Gérant de portefeuille", "Trader", "Sales BFI"] },
  // — Banques françaises —
  { re: /\bbnp\b|paribas/, label: "BNP Paribas", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /societe generale|socgen/, label: "Société Générale", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /credit agricole|cacib/, label: "Crédit Agricole CIB", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /natixis/, label: "Natixis", sectorKey: "finance", metiers: FINANCE_TRADING },
  { re: /amundi/, label: "Amundi", sectorKey: "finance", metiers: FINANCE_AM },
  { re: /oddo|kepler|exane/, label: "Oddo BHF", sectorKey: "finance", metiers: ["Sales BFI", "Analyste M&A", "Trader", "Gérant de portefeuille", "Structureur"] },
  // — Big tech —
  { re: /google|alphabet/, label: "Google", sectorKey: "tech", metiers: TECH },
  { re: /\bmeta\b|facebook/, label: "Meta", sectorKey: "tech", metiers: TECH },
  { re: /microsoft/, label: "Microsoft", sectorKey: "tech", metiers: TECH },
  { re: /amazon|\baws\b/, label: "Amazon", sectorKey: "tech", metiers: TECH },
  { re: /\bapple\b/, label: "Apple", sectorKey: "tech", metiers: TECH },
  { re: /netflix/, label: "Netflix", sectorKey: "tech", metiers: TECH },
  { re: /nvidia/, label: "Nvidia", sectorKey: "tech", metiers: TECH },
  { re: /\buber\b/, label: "Uber", sectorKey: "tech", metiers: TECH },
  { re: /airbnb/, label: "Airbnb", sectorKey: "tech", metiers: TECH },
  { re: /spotify/, label: "Spotify", sectorKey: "tech", metiers: TECH },
  { re: /datadog/, label: "Datadog", sectorKey: "tech", metiers: TECH },
  { re: /\bstripe\b/, label: "Stripe", sectorKey: "tech", metiers: TECH },
  { re: /doctolib/, label: "Doctolib", sectorKey: "tech", metiers: TECH },
  { re: /criteo/, label: "Criteo", sectorKey: "tech", metiers: TECH },
  // — Ferroviaire —
  { re: /\bsncf\b/, label: "SNCF", sectorKey: "public", metiers: RAIL },
  { re: /\bratp\b/, label: "RATP", sectorKey: "public", metiers: ["Conducteur de train", "Contrôleur SNCF", "Agent d'escale"] },
  // — Luxe —
  { re: /\blvmh\b/, label: "LVMH", sectorKey: "marketing", metiers: LUXE },
  { re: /kering/, label: "Kering", sectorKey: "marketing", metiers: LUXE },
  { re: /\bhermes\b/, label: "Hermès", sectorKey: "marketing", metiers: LUXE },
  { re: /chanel/, label: "Chanel", sectorKey: "marketing", metiers: LUXE },
  { re: /\bdior\b/, label: "Dior", sectorKey: "marketing", metiers: LUXE },
  { re: /louis vuitton|vuitton/, label: "Louis Vuitton", sectorKey: "marketing", metiers: LUXE },
  { re: /cartier/, label: "Cartier", sectorKey: "marketing", metiers: LUXE },
  { re: /\bloreal\b|l oreal/, label: "L'Oréal", sectorKey: "marketing", metiers: LUXE },
];

/** Détecte une marque dans la requête normalisée (1re correspondance dans l'ordre). */
export function detectBrand(normalizedQuery: string): BrandHint | null {
  const nq = (normalizedQuery ?? "").trim();
  if (!nq) return null;
  for (const b of BRANDS) {
    if (b.re.test(nq)) {
      return { label: b.label, sectorKey: b.sectorKey, metiers: b.metiers, re: b.re };
    }
  }
  return null;
}

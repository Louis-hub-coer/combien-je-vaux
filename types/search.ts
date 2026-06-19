/**
 * Types publics du moteur de recherche de salaires.
 *
 * Règle absolue : le CSV source reste CÔTÉ SERVEUR. Seuls ces objets légers
 * (résultats déjà filtrés/limités) traversent vers le client.
 */

/** Type de ligne du jeu de données (colonne `type_resultat`). */
export type ResultType =
  | "personne_nom"
  | "metier_entreprise"
  | "metier_standard"
  | "metier_localise"
  | (string & {});

/** Nature de la correspondance, du plus fort au plus faible. */
export type MatchType =
  | "exact"        // nom / nom canonique identique
  | "person"       // personnalité (type_resultat = personne_nom) en exact
  | "job_company"  // métier + entreprise
  | "keyword"      // clé exacte (search_exact_keys / aliases)
  | "coverage"     // couverture partielle des mots de la requête
  | "related"      // résultat proche / exploratoire (non issu du scoring direct)
  | "company"      // métier représentatif d'une entreprise saisie seule
  | "fuzzy";       // repli flou (trigrammes)

export interface SearchParams {
  q: string;
  limit?: number;
}

/** Une variante du même métier : specialisation × ville × tranche d'expérience. */
export interface GroupVariant {
  specialization: string;
  city: string;
  country: string;
  experience: string;
  salaryTotalEur: number | null;
  salaryFixedEur: number | null;
  salaryVariableEur: number | null;
  isDefault: boolean;
}

/** Élément de résultat renvoyé au client (volontairement compact). */
export interface SearchResultItem {
  id: string;
  slug: string;
  type: ResultType;
  displayName: string;
  canonicalName: string;
  category: string;
  subCategory: string;
  job: string;
  position: string;
  specialization: string;
  company: string;
  city: string;
  country: string;
  experience: string;
  salaryDisplay: string;        // ex. "257 100 000 € / an"
  salaryTotalEur: number | null;
  salaryFixedEur: number | null;
  salaryVariableEur: number | null;
  shortAnswer: string;          // reponse_courte_fr
  isDefault: boolean;           // is_default_result : résultat représentatif du groupe
  priority: number;             // search_priority (0..125)
  groupKey: string;             // search_group_key (dédoublonnage)
  groupVariants?: GroupVariant[]; // variantes ville × expérience (best uniquement)
  score: number;
  matchType: MatchType;
}

export interface SearchResponse {
  query: string;
  normalizedQuery: string;
  best: SearchResultItem | null;   // meilleur résultat
  results: SearchResultItem[];     // résultats proches (limités, sans le best)
  total: number;                   // nb de candidats scorés
  fallbackUsed: boolean;           // true si repli flou
  blocked?: boolean;               // true si requête offensante (état propre, aucun résultat)
  companyLabel?: string;           // si la requête est une entreprise seule (ex. "Goldman Sachs")
  tookMs: number;
}

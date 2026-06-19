import type { SearchResultItem } from "@/types/search";

/* ----------------------- Montants ----------------------- */
const NBSP = "\u00A0"; // espace insécable (plus visible que l'espace fine pour séparer les groupes)
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** « 219 200 € » avec séparateurs de milliers insécables et bien visibles. */
export function formatEuro(n: number): string {
  return FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";
}
/** « 219 200 € / an » — à placer dans un conteneur `whitespace-nowrap`. */
export function perYear(n: number): string {
  return `${formatEuro(n)} / an`;
}

/* ----------------------- Catégorie large (sous-titre générique) ----------------------- */
function norm(s: string): string {
  return (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Sous-titre TOUJOURS générique : une catégorie large dérivée de categorie/sous_categorie.
 * Jamais d'entreprise, de ville, de séniorité ni de segment (ceux-ci sont des filtres).
 */
export function broadCategory(item: SearchResultItem): string {
  const cat = norm(item.category);
  const sub = norm(item.subCategory);
  const both = `${cat} ${sub}`;

  if (item.type === "personne_nom") {
    if (/football|basket|tennis|rugby|sport|athlet|\bnba\b|\bnfl\b|golf|boxe/.test(both)) return "Sport";
    if (/musi|chant|rapp|\bdj\b|groupe/.test(both)) return "Musique";
    if (/acteur|realisat|cinema|serie|humorist/.test(both)) return "Cinéma";
    if (/creator|youtub|tiktok|twitch|stream|influence|media|\btv\b|tele|animateur|journal|podcast/.test(both)) return "Média / influence";
    if (/mode|mannequin|artiste|auteur|ecrivain/.test(both)) return "Culture";
    return "Personnalité";
  }

  if (/finance|banque|assuran/.test(cat)) return /marche|trading|bourse/.test(sub) ? "Finance de marché" : "Finance";
  if (/tech|informat|\bdata\b|logiciel|digital/.test(cat)) return "Tech / Data";
  if (/sante|medical/.test(cat)) return "Santé";
  if (/droit|justice|juridi|notari/.test(cat)) return "Droit";
  if (/politique|institution/.test(cat)) return /local|elus|maire|commune/.test(sub) ? "Politique locale" : "Politique";
  if (/fonction publique|securite|defense|police|armee|gendarm/.test(cat)) return "Fonction publique";
  if (/commerce|vente/.test(cat)) return "Commerce";
  if (/\bsport\b/.test(cat)) return "Sport";
  if (/culture|media|creation/.test(cat)) return "Culture";
  if (/marketing|communicat/.test(cat)) return "Communication";
  if (/education|enseign/.test(cat)) return "Éducation";
  if (/batiment|travaux|btp/.test(cat)) return "Bâtiment & TP";
  if (/transport|logistique/.test(cat)) return "Transport & logistique";
  if (/industrie|production/.test(cat)) return "Industrie";
  if (/artisanat|manuel/.test(cat)) return "Artisanat";
  if (/hotell|restaur|tourisme/.test(cat)) return "Hôtellerie-restauration";
  if (/immobil/.test(cat)) return "Immobilier";
  if (/conseil|audit/.test(cat)) return "Conseil";
  if (/\brh\b|recrut|ressources humaines/.test(cat)) return "RH";
  if (/agricult|environ/.test(cat)) return "Agriculture & environnement";
  if (/beaute|bien-etre/.test(cat)) return "Beauté & bien-être";
  if (/service.*personne|proprete/.test(cat)) return "Services";

  const first = (item.category || "").split(/[,&/]/)[0].trim();
  return first || "Métier";
}

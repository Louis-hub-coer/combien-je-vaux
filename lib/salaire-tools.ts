import type { LucideIcon } from "lucide-react";
import { Search, Scale, Calculator, Medal } from "lucide-react";

/**
 * Source unique des 4 outils de l'univers « Salaire ».
 * Utilisée par le dropdown de la navbar ET par le hub /salaire pour garantir
 * des noms, liens et illustrations cohérents. Chaque outil a un rôle distinct.
 */
export interface SalaireTool {
  key: string;
  title: string;       // titre affiché
  href: string;        // destination
  tagline: string;     // mini sous-texte (dropdown)
  description: string; // description du hub (promesse distincte)
  cta: string;         // libellé d'action (hub)
  icon: LucideIcon;
  color: string;
  tint: string;
  ready: boolean;      // false -> page préparée (placeholder)
}

export const salaireTools: SalaireTool[] = [
  {
    key: "recherche",
    title: "Rechercher un salaire",
    href: "/salaires",
    tagline: "Métiers, personnalités, secteurs",
    description: "Explorez les revenus des métiers et des personnalités.",
    cta: "Rechercher",
    icon: Search,
    color: "#00C389",
    tint: "#E1F7EF",
    ready: true,
  },
  {
    key: "comparateur",
    title: "Comparer mon salaire",
    href: "/salaire/comparateur",
    tagline: "Découvrez qui gagne comme vous",
    description: "Entrez votre salaire et voyez quels métiers et personnalités gagnent comme vous.",
    cta: "Comparer",
    icon: Scale,
    color: "#7C3AED",
    tint: "#EEE7FD",
    ready: true,
  },
  {
    key: "brut-net",
    title: "Brut ↔ net",
    href: "/salaire/brut-net",
    tagline: "Convertir en quelques secondes",
    description: "Convertissez un salaire brut en net, et inversement, en quelques secondes.",
    cta: "Convertir",
    icon: Calculator,
    color: "#2F6BFF",
    tint: "#EAF1FF",
    ready: true,
  },
  {
    key: "top-france",
    title: "Suis-je dans le top 10 % ?",
    href: "/salaire/top-france",
    tagline: "Situez-vous face aux Français",
    description: "Situez votre salaire dans la distribution française : médiane, top 10 %, top 1 %.",
    cta: "Me situer",
    icon: Medal,
    color: "#F59E0B",
    tint: "#FEF1D8",
    ready: true,
  },
];

export const salaireHub = {
  title: "Tous les outils salaire",
  subtitle: "Recherchez, comparez, convertissez et situez votre salaire en quelques secondes.",
};

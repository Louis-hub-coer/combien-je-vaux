import {
  Search,
  BarChart3,
  TrendingUp,
  Wallet,
  Coins,
  Home,
  Calendar,
  PieChart,
  Briefcase,
  Star,
  Stethoscope,
  Landmark,
  Building2,
  Dumbbell,
  Cpu,
  type LucideIcon,
} from "lucide-react";

/** Couleur + teinte associées à une catégorie. Appliquées en style inline
 *  (Tailwind ne génère pas de classes dynamiques `bg-${x}`). */
export type Swatch = { color: string; tint: string };

export const palette = {
  green: { color: "#00C389", tint: "#E1F7EF" },
  blue: { color: "#2F6BFF", tint: "#EAF1FF" },
  violet: { color: "#7C3AED", tint: "#EEE7FD" },
  amber: { color: "#F59E0B", tint: "#FEF1D8" },
  cyan: { color: "#06B6D4", tint: "#DEF7FB" },
  coral: { color: "#FF4D67", tint: "#FFE5EA" },
} satisfies Record<string, Swatch>;

export type NavItem = { label: string; href: string } & Swatch;

export const navItems: NavItem[] = [
  { label: "Salaire", href: "/salaire", ...palette.green },
  { label: "Immobilier", href: "/immobilier", ...palette.blue },
  { label: "Crédit", href: "/credit", ...palette.violet },
  { label: "Investir", href: "/investissement", ...palette.amber },
  { label: "Retraite", href: "/retraite", ...palette.cyan },
  { label: "Impôts", href: "/impots", ...palette.coral },
];

export type ValueProp = { title: string; text: string; icon: LucideIcon } & Swatch;

export const valueProps: ValueProp[] = [
  {
    title: "Cherchez",
    text: "Le salaire d'un métier ou d'une personnalité.",
    icon: Search,
    ...palette.cyan,
  },
  {
    title: "Comparez",
    text: "Situez-vous face aux Français de votre âge et de votre secteur.",
    icon: BarChart3,
    ...palette.blue,
  },
  {
    title: "Décidez",
    text: "Score, projection, recommandations : agissez pour votre avenir.",
    icon: TrendingUp,
    ...palette.green,
  },
];

export type Tool = { name: string; href: string; icon: LucideIcon } & Swatch;

export const popularTools: Tool[] = [
  { name: "Salaire brut / net", href: "/salaire/brut-net", icon: Wallet, ...palette.green },
  { name: "Combien puis-je emprunter ?", href: "/credit/combien-puis-je-emprunter", icon: Coins, ...palette.violet },
  { name: "Acheter ou louer ?", href: "/immobilier/acheter-ou-louer", icon: Home, ...palette.blue },
  { name: "Intérêts composés", href: "/investissement/interets-composes", icon: TrendingUp, ...palette.amber },
  { name: "Mon âge de départ", href: "/retraite/age-de-depart", icon: Calendar, ...palette.cyan },
  { name: "Suis-je riche ?", href: "/questions-argent/suis-je-riche", icon: PieChart, ...palette.coral },
];

export type Question = { label: string; href: string } & Swatch;

export const popularQuestions: Question[] = [
  { label: "Suis-je bien payé ?", href: "/salaire/suis-je-bien-paye", ...palette.green },
  { label: "Combien gagne un influenceur ?", href: "/questions-argent/salaire-influenceur", ...palette.coral },
  { label: "Quel patrimoine à mon âge ?", href: "/questions-argent/patrimoine-age", ...palette.blue },
  { label: "Puis-je devenir millionnaire ?", href: "/questions-argent/devenir-millionnaire", ...palette.amber },
  { label: "Combien gagne un médecin ?", href: "/salaire/salaire-medecin", ...palette.cyan },
  { label: "Suis-je dans le top 10 % ?", href: "/questions-argent/top-10-pourcent", ...palette.violet },
];

export type Article = { tag: string; title: string; minutes: number; href: string; icon: LucideIcon } & Swatch;

export const featuredArticles: Article[] = [
  { tag: "Salaire", title: "Salaire moyen en France en 2026", minutes: 4, href: "/questions-argent/salaire-moyen-france", icon: Wallet, ...palette.green },
  { tag: "Patrimoine", title: "Patrimoine moyen à 30 ans", minutes: 5, href: "/questions-argent/patrimoine-age", icon: TrendingUp, ...palette.violet },
  { tag: "Célébrités", title: "Combien gagnent vraiment les stars ?", minutes: 6, href: "/questions-argent/salaires-celebrites", icon: Star, ...palette.coral },
];

/** Placeholders du futur moteur de recherche de salaires (non branché en Phase 1). */
export const SALARY_SEARCH_PLACEHOLDER =
  "Cherchez un métier ou une personnalité…";

export type SearchType = { label: string; icon: LucideIcon };

/** Ce que l'on peut chercher (rendu explicite sous la barre). */
export const searchTypes: SearchType[] = [
  { label: "Un métier", icon: Briefcase },
  { label: "Un secteur", icon: Building2 },
  { label: "Une célébrité", icon: Star },
  { label: "Un métier précis", icon: Stethoscope },
];

export type SearchExample = { label: string; color: string; icon: LucideIcon };

export const searchExamples: SearchExample[] = [
  { label: "Mbappé", color: palette.coral.color, icon: Star },
  { label: "Trader", color: palette.violet.color, icon: Briefcase },
  { label: "Cardiologue", color: palette.cyan.color, icon: Stethoscope },
  { label: "Prof de sport", color: palette.green.color, icon: Dumbbell },
  { label: "Data scientist", color: palette.blue.color, icon: Cpu },
  { label: "IShowSpeed", color: palette.coral.color, icon: Star },
];

/** Mots qui défilent dans l'accroche (conservé pour réutilisation éventuelle). */
export const rotatingWords: { word: string; color: string }[] = [
  { word: "salaire", color: palette.green.color },
  { word: "immobilier", color: palette.blue.color },
  { word: "retraite", color: palette.cyan.color },
  { word: "investissement", color: palette.amber.color },
];

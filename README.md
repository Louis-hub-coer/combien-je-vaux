# Combien je vaux — Phase 1

La référence française pour comprendre, simplement, son argent.
Cette Phase 1 contient le **design system**, la **navbar** et la **homepage**.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 3.4** (tokens dans `tailwind.config.ts`)
- **lucide-react** (icônes)
- Polices via `next/font/google` : `Schibsted Grotesk` (titres) + `Hanken Grotesk` (texte)

## Structure

```
app/
  layout.tsx        # fonts, métadonnées SEO/OG, <Navbar> + <Footer>
  page.tsx          # homepage (assemble les sections)
  globals.css       # base Tailwind + gradients (hero, bilan, newsletter)
  salaires/page.tsx # page dédiée au futur moteur (placeholder)
components/
  ui/               # Logo, Button, Container, Gauge, SalarySearchBar
  layout/           # Navbar (menu mobile + recherche), Footer
  marketing/        # Hero, ValueCards, ToolGrid, BilanCTA, PopularQuestions,
                    # EditorialGrid, Newsletter, SectionHead
lib/
  constants.ts      # palette catégories, navbar, outils, questions, articles
  format.ts         # formatEuro / formatPercent / formatNumber
types/
  search.ts         # types du futur moteur de recherche (stub)
data/               # données SERVEUR uniquement (voir data/README.md)
```

## Design system

- **Couleurs** : `ink #0F172A`, `slate #64748B`, `line #E7EAF1`, `surface #F7F9FC`,
  `brand #00C389`. Plus un **système par catégorie** (Salaire vert, Immobilier
  bleu, Crédit violet, Investissement ambre, Retraite cyan, Impôts corail) — la
  couleur encode l'information. Les teintes catégorie sont appliquées en style
  inline (les classes Tailwind dynamiques ne sont pas générées au build).
- **Boutons** : texte `ink` sur fond `brand` (contraste AA), variantes `ghost` et
  `light`.
- **Signature** : la jauge de score (`components/ui/Gauge.tsx`), reprise dans le
  logo et le bloc bilan.
- Responsive mobile-first, focus clavier visible.

## Moteur de recherche de salaires — provisionné, pas encore branché

La Phase 1 pose seulement les **emplacements visuels** :

- **Homepage** : barre `SalarySearchBar` dans le hero (placeholder « Rechercher
  un salaire, un métier ou une personnalité… »).
- **Navbar** : icône de recherche qui pointe vers `/salaires`.
- **/salaires** : page dédiée en « bientôt disponible ».

**Aucune donnée n'est chargée.** Quand on branchera le moteur (phase dédiée) :

1. Déposer `salary_master_22000_search_ready_final.csv` dans `data/` (serveur).
2. Le CSV **reste côté serveur** — jamais importé dans un composant client ni
   envoyé au navigateur.
3. Créer `app/api/salaires/search/route.ts` (ou une server action) qui lit +
   indexe le CSV côté serveur et ne renvoie que les résultats filtrés / paginés
   (`SalarySearchResult` dans `types/search.ts`).
4. Remplacer la barre placeholder par un champ relié à ce endpoint
   (debounce, pagination).

## Prochaines phases

Phase 2 : Salaire + questions d'argent · Phase 3 : Immobilier + Crédit ·
Phase 4 : Investissement / Retraite / Impôts · Phase 5 : bilan « Combien je vaux »
+ score + compte · Phase dédiée : moteur de recherche salaires + SEO.

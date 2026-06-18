# Mettre le site en ligne sur Vercel (sans terminal)

Objectif : obtenir une URL publique `https://...vercel.app` pour tester tout le site.

Le moteur lit un gros fichier CSV **uniquement côté serveur**. Comme il fait 51 Mo
(au-delà de la limite d'upload du navigateur sur GitHub, 25 Mo), on l'héberge dans une
**Release GitHub** et le build le télécharge automatiquement. Le CSV n'est jamais envoyé au navigateur.

---

## Étape 1 — Créer le dépôt GitHub et y mettre le code
1. Va sur https://github.com → connecte-toi → bouton **New** (nouveau dépôt).
2. Nom : `combien-je-vaux`. Coche **Public**. Clique **Create repository**.
3. Sur la page du dépôt : **Add file ▸ Upload files**.
4. Glisse-dépose **tout le contenu** du dossier du projet (les fichiers et dossiers : `app`, `components`, `lib`, `data`, `package.json`, etc.).
   - ⚠️ N'inclus PAS `node_modules` ni `data/search-index.json` (ils se régénèrent tout seuls).
   - Le dossier `data` doit contenir au moins `README.md` (déjà présent).
5. Clique **Commit changes**.

## Étape 2 — Héberger le CSV dans une Release
1. Sur le dépôt : à droite, clique **Releases** ▸ **Create a new release** (ou **Draft a new release**).
2. **Choose a tag** : tape `data` puis « Create new tag ».
3. Dans **Attach binaries…**, glisse le fichier `salary_master_33000_claude_ready_minimal.csv` (l'upload navigateur accepte les gros fichiers ici).
4. Clique **Publish release**.
5. La release affiche le CSV : **clic droit ▸ Copier l'adresse du lien** sur le fichier `.csv`.
   L'URL ressemble à :
   `https://github.com/TON-COMPTE/combien-je-vaux/releases/download/data/salary_master_33000_claude_ready_minimal.csv`
   Garde cette URL pour l'étape 4.

## Étape 3 — Importer le projet sur Vercel
1. Va sur https://vercel.com → **Sign up / Log in** avec **GitHub**.
2. **Add New… ▸ Project**.
3. Trouve `combien-je-vaux` dans la liste ▸ **Import**.
4. Framework : Vercel détecte **Next.js** automatiquement. Ne touche à rien pour l'instant.

## Étape 4 — Configurer la variable du CSV
1. Avant de déployer, ouvre **Environment Variables**.
2. Ajoute :
   - **Name** : `SALARY_CSV_URL`
   - **Value** : l'URL du CSV copiée à l'étape 2.
3. (Build command : laisse l'auto-détection. Le projet utilise déjà `vercel-build` =
   `npm run build:search-index && next build`. Si un champ « Build Command » est proposé et que tu veux le remplir :
   `npm run build:search-index && npm run build`.)

## Étape 5 — Déployer
1. Clique **Deploy**.
2. Le build : installe les dépendances → télécharge le CSV → génère l'index → build Next.js (≈ 1 à 3 min).
3. À la fin, Vercel affiche un lien **`https://combien-je-vaux-xxxx.vercel.app`**. C'est ton site en ligne.

---

## Tester en ligne
- Homepage : tape une recherche + **Entrée** ou **Rechercher** → redirige vers `/salaires?q=…`.
- Exemples d'URL directes :
  - `/salaires?q=Mbappé`
  - `/salaires?q=Trader%20Goldman%20Sachs`
  - `/salaires?q=Médecin`
- Toutes les requêtes du CSV fonctionnent (personnalités, métiers, entreprises, villes, expérience…).

## Notes
- 1re requête après une période d'inactivité : ~1 à 2 s (chargement de l'index en mémoire), puis ~50–100 ms.
- Le CSV reste **côté serveur** ; seul l'index (calculé au build) est embarqué dans la fonction API.
- Offre **Hobby (gratuite)** suffisante pour tester. Pour des temps de réponse encore plus stables, l'offre Pro permet d'augmenter la durée/mémoire des fonctions.
- Si la 1re requête renvoie une erreur de délai : relance la requête (l'index se met en cache après le 1er appel).

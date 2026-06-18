# data/ — données de recherche (CÔTÉ SERVEUR UNIQUEMENT)

Le CSV des salaires reste **strictement côté serveur**. Il n'est jamais importé
dans un composant client ni envoyé au navigateur :

- lu uniquement par `lib/search/dataset.ts` (marqué `import "server-only"`) ;
- via le runtime **Node.js** (`app/api/salaires/search/route.ts`).

## Fichier attendu

```
data/salary_master_33000_claude_ready_minimal.csv
```

Chemin surchargeable avec la variable d'environnement `SALARY_CSV_PATH`.

> Ce fichier (~51 Mo) est **exclu du zip de livraison**. Place-le ici avant de
> lancer l'app ou le test.

## Mini-test

```
node --conditions=react-server --import tsx scripts/search-smoke.ts
```

## Colonnes utilisées (mapping réel)

`id, type_resultat, nom, nom_canonique, categorie, sous_categorie, metier, poste,
specialisation, entreprise, ville, pays, salaire_affichage, salaire_reel_total_eur,
reponse_courte_fr, url_slug, search_exact_keys, search_aliases, search_group_key,
search_priority, is_default_result`

Absentes du CSV (gérées) : `query_examples_fr` (ignorée), `normalized_search_text`
(recalculée), `verification_status` (remplacée par `is_default_result`).

/**
 * Pré-calcule l'index de recherche pour des requêtes rapides DÈS le 1er appel.
 * Lancer : npm run build:search-index   (lit data/<csv> -> écrit data/search-index.json)
 *
 * Déploiement (Vercel) : si le CSV n'est pas présent sur le disque, il est téléchargé
 * depuis l'URL de la variable d'environnement SALARY_CSV_URL (ex. asset de GitHub Release).
 * Le CSV reste côté serveur ; seul l'index est embarqué dans la fonction API.
 */
import { readFile, writeFile, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { buildLeanFromCsv, CSV_PATH, INDEX_PATH } from "../lib/search/dataset";

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureCsv(): Promise<void> {
  if (await exists(CSV_PATH)) return;
  const url = process.env.SALARY_CSV_URL;
  if (!url) {
    throw new Error(
      `CSV introuvable (${CSV_PATH}) et SALARY_CSV_URL non défini.\n` +
        `→ Placez le CSV dans data/ en local, ou définissez SALARY_CSV_URL (URL de téléchargement direct) sur Vercel.`,
    );
  }
  console.log(`CSV absent — téléchargement depuis SALARY_CSV_URL …`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement CSV échoué : HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(CSV_PATH), { recursive: true });
  await writeFile(CSV_PATH, buf);
  console.log(`CSV téléchargé : ${(buf.length / 1e6).toFixed(1)} Mo`);
}

async function main() {
  const t0 = Date.now();
  await ensureCsv();
  const text = await readFile(CSV_PATH, "utf8");
  const lean = buildLeanFromCsv(text);
  await writeFile(INDEX_PATH, JSON.stringify(lean));
  const size = (await stat(INDEX_PATH)).size;
  console.log(
    `Index écrit : ${INDEX_PATH}\n  ${lean.length} lignes · ${(size / 1e6).toFixed(1)} Mo · ${Date.now() - t0} ms`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

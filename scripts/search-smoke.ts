/**
 * Mini-test du moteur sur le VRAI CSV.
 * Lancer : node --conditions=react-server --import tsx scripts/search-smoke.ts
 * (cwd = racine du projet pour que data/<csv> soit trouvé)
 */
import { searchSalaries } from "../lib/search/search";

const QUERIES = [
  "Trader Goldman Sachs",
  "Mbappé",
  "Cardiologue libéral",
  "Prof de sport",
  "Général d'armée",
  "Data scientist Google Paris",
  "Sales banque américaine",
  "IShowSpeed",
];

async function main() {
  for (const q of QUERIES) {
    const r = await searchSalaries({ q, limit: 3 });
    const tag = r.fallbackUsed ? " [repli flou]" : "";
    console.log(`\n🔎 ${q}  —  ${r.tookMs}ms, ${r.total} candidats${tag}`);
    if (r.best) {
      console.log(`   ★ ${r.best.displayName}  |  ${r.best.matchType}  |  score ${r.best.score}  |  ${r.best.salaryDisplay || "—"}`);
    } else {
      console.log("   ★ (aucun)");
    }
    r.results.forEach((x, i) =>
      console.log(`     ${i + 1}. ${x.displayName}  |  ${x.matchType}  |  ${x.score}  |  ${x.salaryDisplay || "—"}`),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

"use client";

import { useState } from "react";
import {
  Scale, Sparkles, BookOpen, MapPin, Layers,
  Star, Briefcase, Banknote, HeartPulse, Cpu, Gavel, Lightbulb, Megaphone, Building2, Factory, Trophy, Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatEuro, perYear, broadCategory } from "@/lib/display";
import type { SearchResultItem, GroupVariant } from "@/types/search";

/* ---------------- helpers ---------------- */
function cleanName(s: string) {
  return s.replace(/^salaires?\s+/i, "").trim() || s;
}
function lower1(s: string) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
function norm(s: string) {
  return (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function startNum(s: string) {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : 999;
}
function isRealXp(xp: string): boolean {
  const t = (xp ?? "").trim();
  return !!t && !t.includes("[") && !/notori/i.test(t);
}
function level(xp: string): string {
  const n = startNum(xp);
  if (n < 2) return "Junior";
  if (n < 5) return "Confirmé";
  if (n < 10) return "Senior";
  if (n < 999) return "Expert";
  return "";
}

export function sectorVisual(item: SearchResultItem): { Icon: LucideIcon; color: string; tint: string } {
  if (item.type === "personne_nom") return { Icon: Star, color: "#FF4D67", tint: "#FFE5EA" };
  const t = norm(`${item.category} ${item.subCategory} ${item.job} ${item.position}`);
  const has = (re: RegExp) => re.test(t);
  if (has(/banqu|financ|trading|trader|sales|bourse|march|investiss|audit|comptab|assurance|m&a|fusion|private equity|hedge|quant|fonds/))
    return { Icon: Banknote, color: "#7C3AED", tint: "#EEE7FD" };
  if (has(/sante|medec|medic|soin|infirm|cardio|hopital|hospital|pharma|chirurg|dentiste|kine|veterinair/))
    return { Icon: HeartPulse, color: "#06B6D4", tint: "#DEF7FB" };
  if (has(/tech|data|develop|logiciel|software|machine learning|\bia\b|intellig|cyber|scientist|devops|cloud|informat/))
    return { Icon: Cpu, color: "#00C389", tint: "#E1F7EF" };
  if (has(/droit|avocat|jurist|notaire|legal|justice|magistrat/))
    return { Icon: Gavel, color: "#2F6BFF", tint: "#EAF1FF" };
  if (has(/conseil|consultant|strateg|advisory/))
    return { Icon: Lightbulb, color: "#F59E0B", tint: "#FEF1D8" };
  if (has(/marketing|communicat|brand|growth|publicit|media|influence/))
    return { Icon: Megaphone, color: "#FF4D67", tint: "#FFE5EA" };
  if (has(/immobil|foncier|agent immo/))
    return { Icon: Building2, color: "#2F6BFF", tint: "#EAF1FF" };
  if (has(/industr|ingenieur|usine|mecaniq|energie|btp|construct|aeronaut|automobil|nucleair|chimie|logistique|transport/))
    return { Icon: Factory, color: "#F59E0B", tint: "#FEF1D8" };
  if (has(/sport|foot|athlet|coach sportif|\beps\b|basket|tennis|rugby|cyclis/))
    return { Icon: Trophy, color: "#00C389", tint: "#E1F7EF" };
  if (has(/public|fonction|enseign|professeur|\bprof\b|armee|gendarm|militair|police|maire|elu|ministre|politique/))
    return { Icon: Landmark, color: "#7C3AED", tint: "#EEE7FD" };
  return { Icon: Briefcase, color: "#7C3AED", tint: "#EEE7FD" };
}

const cityLabel = (v: GroupVariant) => v.city || v.country || "France";

function dedupExp(list: GroupVariant[]): GroupVariant[] {
  const m = new Map<string, GroupVariant>();
  for (const v of list) {
    const cur = m.get(v.experience);
    if (!cur || (v.isDefault && !cur.isDefault)) m.set(v.experience, v);
  }
  return [...m.values()].sort((a, b) => startNum(a.experience) - startNum(b.experience));
}

/** Libellé générique du filtre de segment selon le type de valeurs (jamais une marque). */
function segLabel(dim: "specialization" | "city", values: string[]): string {
  if (dim === "city") return "Salaire par ville";
  const j = norm(values.join(" "));
  if (/banque|anglo|americ|amer|fonds|bfi/.test(j)) return "Type de structure";
  if (/liberal|hospital|salar|titulaire|officine|associe|cabinet|exercice/.test(j)) return "Mode d'exercice";
  if (/commune|ville moyenne|grande ville|petite/.test(j)) return "Type de commune";
  if (/categorie [abc]/.test(j)) return "Catégorie";
  if (/officier|militaire|agrege|certifie|contractuel|conferences|universites|recherche|titulaire/.test(j)) return "Statut";
  return "Profil";
}

/** Présélection du filtre à partir des mots précis de la requête (Goldman → anglo-saxonne, etc.). */
function pickSegment(dim: "specialization" | "city", segments: string[], query: string): string {
  const q = norm(query);
  const sing = (t: string) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t);
  const qToks = new Set(q.split(" ").filter(Boolean).map(sing));

  // 1) libellé de segment présent tel quel (libéral, grande ville, Paris…)
  for (const s of segments) {
    const sn = norm(s);
    if (dim === "city" && sn === "france") continue;
    if (sn.length >= 3 && q.includes(sn)) return s;
  }
  // 2) meilleur recouvrement de mots distinctifs (singulier/pluriel) :
  //    « commercial grand compte » → « Grands comptes (KAM) » ; « fonctionnaire catégorie A » → « Catégorie A ».
  let best = "";
  let bestScore = 0;
  for (const s of segments) {
    const sn = norm(s);
    if (dim === "city" && sn === "france") continue;
    const toks = sn.replace(/[()]/g, " ").split(/[^a-z0-9]+/).filter(Boolean).map(sing);
    let score = 0;
    for (const t of toks) {
      if (t.length >= 3 && qToks.has(t)) score += 2;       // mot distinctif
      else if (/^[a-z]$/.test(t) && qToks.has(t)) score += 1; // lettre (catégorie A/B/C)
    }
    if (score > bestScore) { bestScore = score; best = s; }
  }
  if (bestScore > 0) return best;

  // 3) marchés financiers : marque → type de structure
  if (dim === "specialization") {
    const anglo = /goldman|sachs|morgan|jpmorgan|\bjp\b|citi|barclays|\bubs\b|credit suisse|deutsche|hsbc|lazard|rothschild|nomura|jefferies|moelis|evercore|merrill|bofa|bank of america|blackrock|blackstone|\bkkr\b|carlyle/;
    const french = /\bbnp\b|paribas|societe generale|socgen|\bsg\b|natixis|credit agricole|cacib|oddo|kepler|exane|amundi/;
    if (anglo.test(q)) { const m = segments.find((s) => /anglo|americ|amer|international/.test(norm(s))); if (m) return m; }
    if (french.test(q)) { const m = segments.find((s) => /francais|france/.test(norm(s))); if (m) return m; }
  }
  return "";
}

/* ---------------- composant ---------------- */
export function BestResultCard({
  item,
  fallbackUsed,
  query = "",
}: {
  item: SearchResultItem;
  fallbackUsed: boolean;
  query?: string;
}) {
  const sv = sectorVisual(item);
  const isPerson = item.type === "personne_nom";

  const usable = (item.groupVariants ?? []).filter((v) => v.salaryTotalEur != null);

  // Dimension de filtre réellement présente : specialisation, sinon ville.
  const specs = [...new Set(usable.map((v) => v.specialization).filter(Boolean))];
  const cities = [...new Set(usable.map(cityLabel))];
  const segDim: "specialization" | "city" | null =
    specs.length >= 2 ? "specialization" : cities.length >= 2 ? "city" : null;
  const segments = segDim === "specialization" ? specs : segDim === "city" ? cities : [];
  const segOf = (v: GroupVariant) =>
    segDim === "specialization" ? v.specialization : segDim === "city" ? cityLabel(v) : "";

  const defaultSeg = segDim
    ? pickSegment(segDim, segments, query) || segOf(usable.find((v) => v.isDefault) ?? usable[0] ?? ({} as GroupVariant))
    : "";
  const [seg, setSeg] = useState(defaultSeg);
  const [expLabel, setExpLabel] = useState(item.experience || "");

  // 1) segment d'abord (filtre) ; 2) puis la grille de séniorité pour ce segment.
  const scope = segDim ? usable.filter((v) => segOf(v) === seg) : usable;
  const expList = dedupExp(scope.filter((v) => isRealXp(v.experience)));
  const current =
    expList.find((e) => e.experience === expLabel) ??
    expList.find((e) => e.isDefault) ??
    expList[0] ??
    scope.find((v) => v.isDefault) ??
    scope[0] ??
    usable[0] ??
    null;

  const showSeg = segments.length >= 2;
  const showExp = expList.length >= 2;
  const nationalNote = !isPerson && !showSeg && !showExp;

  const total = current ? current.salaryTotalEur : item.salaryTotalEur;
  const fixed = (current ? current.salaryFixedEur : item.salaryFixedEur) ?? 0;
  const variable = (current ? current.salaryVariableEur : item.salaryVariableEur) ?? 0;
  const mainAmount = total != null ? perYear(total) : item.salaryDisplay;

  // Montant d'un segment, à la séniorité actuellement sélectionnée (pour les chips).
  const segAmount = (s: string): number | null => {
    const sc = usable.filter((v) => segOf(v) === s);
    const at = sc.find((v) => v.experience === current?.experience);
    const rep = at ?? sc.find((v) => v.isDefault) ?? sc[0];
    return rep?.salaryTotalEur ?? null;
  };
  const segList = showSeg
    ? [...segments].sort((a, b) => (segAmount(a) ?? 0) - (segAmount(b) ?? 0))
    : [];

  const subtitle = broadCategory(item);
  const estLabel =
    "Revenu estimé" + (showSeg ? ` · ${seg}` : "") + (showExp && current ? ` · ${current.experience}` : "");
  const SegIcon = segDim === "city" ? MapPin : Layers;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,.04),0_28px_56px_-20px_rgba(15,23,42,.28)]">
      <style>{`@keyframes cjvFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}`}</style>
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${sv.color}, ${sv.color}00)` }} />
      <div className="p-6 md:p-8">
        {/* En-tête — TITRE + SOUS-TITRE GÉNÉRIQUES */}
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_8px_18px_-8px_rgba(15,23,42,.25)]" style={{ background: sv.tint, color: sv.color }}>
            <sv.Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: sv.tint, color: sv.color }}>
                <span className="h-[6px] w-[6px] rounded-full" style={{ background: sv.color }} />
                {isPerson ? "Personnalité" : "Métier"}
              </span>
              {fallbackUsed && <span className="text-[12px] font-medium text-slate-soft">Résultat le plus proche</span>}
            </div>
            <h2 className="mt-2 font-display text-[clamp(23px,3.4vw,32px)] font-bold leading-[1.1] tracking-[-0.01em] text-ink">
              {cleanName(item.displayName)}
            </h2>
            <p className="mt-1 text-[14px] font-medium text-slate">{subtitle}</p>
          </div>
        </div>

        {/* Revenu estimé — valorisé, montant très lisible */}
        <div className="mt-5 rounded-2xl border border-line p-5 md:p-6" style={{ background: `linear-gradient(180deg, ${sv.tint}66, #FFFFFF 70%)` }}>
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate">{estLabel}</span>
          <div
            className="mt-1.5 max-w-full overflow-hidden whitespace-nowrap font-display text-[clamp(26px,5.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink [font-variant-numeric:tabular-nums]"
            style={{ wordSpacing: "0.22em" }}
          >
            {mainAmount}
          </div>
          {fixed > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] leading-none">
                <span className="h-2 w-2 rounded-full bg-brand" />
                <span className="text-slate">Fixe</span>
                <span className="whitespace-nowrap font-semibold text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.12em" }}>{formatEuro(fixed)}</span>
              </span>
              {variable > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] leading-none">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#7C3AED" }} />
                  <span className="text-slate">Variable</span>
                  <span className="whitespace-nowrap font-semibold text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.12em" }}>{formatEuro(variable)}</span>
                </span>
              )}
            </div>
          )}
          {nationalNote && <p className="mt-2 text-[12.5px] text-slate-soft">Estimation nationale</p>}
        </div>

        {/* 1) Filtre de segment (specialisation OU ville) — la précision vit ICI, pas dans le titre */}
        {showSeg && (
          <Section title={segLabel(segDim!, segments)} icon={SegIcon}>
            <div className="flex flex-wrap gap-2">
              {segList.map((s) => {
                const active = s === seg;
                const amt = segAmount(s);
                return (
                  <button
                    key={s}
                    onClick={() => setSeg(s)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      active
                        ? "border-brand bg-brand-tint shadow-[0_8px_20px_-10px_rgba(0,195,137,.6)] ring-1 ring-inset ring-brand/40"
                        : "border-line bg-white hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft"
                    }`}
                  >
                    <span className={`text-[13px] font-semibold ${active ? "text-brand-dark" : "text-ink"}`}>{s}</span>
                    {amt != null && <span className="whitespace-nowrap text-[12px] text-slate-soft [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.1em" }}>{formatEuro(amt)}</span>}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* 2) Grille de séniorité pour le segment sélectionné */}
        {showExp && (
          <Section title="Salaire selon l'expérience">
            <div key={seg} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" style={{ animation: "cjvFade .25s ease" }}>
              {expList.map((v) => {
                const active = current?.experience === v.experience;
                const lvl = level(v.experience);
                return (
                  <button
                    key={v.experience}
                    onClick={() => setExpLabel(v.experience)}
                    aria-pressed={active}
                    className={`rounded-2xl border p-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      active
                        ? "border-brand bg-brand-tint shadow-[0_10px_24px_-12px_rgba(0,195,137,.6)]"
                        : "border-line bg-white hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
                      {lvl && <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] ${active ? "text-brand-dark" : "text-slate-soft"}`}>{lvl}</span>}
                      {lvl && <span className="shrink-0 text-[11px] text-slate-soft/70">·</span>}
                      <span className="truncate text-[11.5px] font-medium text-slate">{v.experience}</span>
                    </span>
                    <span className="mt-1.5 block whitespace-nowrap text-[14.5px] font-bold text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.12em" }}>
                      {v.salaryTotalEur != null ? formatEuro(v.salaryTotalEur) : "—"}
                      <span className="ml-1 text-[11px] font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ an</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Synthèse */}
        <div className="mt-6 border-t border-line/70 pt-5">
          <p className="max-w-[54ch] text-[15.5px] leading-[1.6] text-ink/80">{synthesize(item, total)}</p>
        </div>

        {/* CTA */}
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Button href="#" className="w-full sm:w-auto">
            <Scale className="h-4 w-4" />
            Comparer avec mon salaire
          </Button>
          <Button href="#" variant="ghost" className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4" />
            Combien je vaux ?
          </Button>
        </div>

        {/* Sources */}
        <div className="mt-6 flex items-start gap-2 border-t border-line pt-4 text-[12.5px] leading-relaxed text-slate-soft">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold text-slate">Sources&nbsp;:</span> études de rémunération, données
            publiques et estimations marché agrégées.
          </span>
        </div>
      </div>
    </article>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-soft" aria-hidden />}
        {title}
      </span>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function synthesize(it: SearchResultItem, total: number | null): string {
  const py = total != null ? `${formatEuro(total)} par an` : "une estimation indicative";
  if (it.type === "personne_nom") {
    return total != null
      ? `${cleanName(it.displayName)} perçoit un revenu estimé à environ ${py}.`
      : `${cleanName(it.displayName)} : revenu estimé.`;
  }
  const role = lower1(it.position || it.job || "ce métier");
  return `Le métier de ${role} est estimé autour de ${py}. Affinez avec les filtres ci-dessus.`;
}

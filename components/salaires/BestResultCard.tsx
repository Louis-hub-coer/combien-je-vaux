"use client";

import { useState } from "react";
import {
  Scale, Sparkles, BookOpen, MapPin,
  Star, Briefcase, Banknote, HeartPulse, Cpu, Gavel, Lightbulb, Megaphone, Building2, Factory, Trophy, Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SearchResultItem, GroupVariant } from "@/types/search";

/* ---------------- helpers ---------------- */
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
function eur(n: number) {
  return `${FMT.format(Math.round(n))} €`;
}
function perYear(n: number) {
  return `${eur(n)} / an`;
}
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
  if (n < 8) return "Senior";
  if (n < 999) return "Expert";
  return "";
}

export function sectorVisual(item: SearchResultItem): { Icon: LucideIcon; color: string; tint: string } {
  if (item.type === "personne_nom") return { Icon: Star, color: "#FF4D67", tint: "#FFE5EA" };
  const t = norm(`${item.category} ${item.subCategory} ${item.job} ${item.position}`);
  const has = (re: RegExp) => re.test(t);
  if (has(/banqu|financ|trading|trader|sales|bourse|march|investiss|audit|comptab|assurance|m&a|fusion|private equity|hedge|quant/))
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
  if (has(/industr|ingenieur|usine|mecaniq|energie|btp|construct|aeronaut|automobil|nucleair|chimie|logistique/))
    return { Icon: Factory, color: "#F59E0B", tint: "#FEF1D8" };
  if (has(/sport|foot|athlet|coach sportif|\beps\b|basket|tennis|rugby|cyclis/))
    return { Icon: Trophy, color: "#00C389", tint: "#E1F7EF" };
  if (has(/public|fonction|enseign|professeur|\bprof\b|armee|gendarm|militair|general|police/))
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
function cityMattersFn(variants: GroupVariant[]): boolean {
  if (new Set(variants.map(cityLabel)).size < 2) return false;
  const byExp = new Map<string, Set<number>>();
  for (const v of variants) {
    if (v.salaryTotalEur == null) continue;
    const s = byExp.get(v.experience) ?? new Set<number>();
    s.add(v.salaryTotalEur);
    byExp.set(v.experience, s);
  }
  for (const s of byExp.values()) if (s.size > 1) return true;
  return false;
}

/* ---------------- composant ---------------- */
export function BestResultCard({ item, fallbackUsed }: { item: SearchResultItem; fallbackUsed: boolean }) {
  const sv = sectorVisual(item);
  const isPerson = item.type === "personne_nom";

  // Variantes exploitables (expérience réelle, salaire connu).
  const usable = (item.groupVariants ?? []).filter((v) => v.salaryTotalEur != null && isRealXp(v.experience));
  const cityMatters = cityMattersFn(usable);

  const cities = [...new Set(usable.map(cityLabel))];
  const [city, setCity] = useState(item.city || item.country || cities[0] || "France");
  const [expLabel, setExpLabel] = useState(item.experience || "");

  // 1) Ville d'abord (filtre) ; 2) puis la grille de séniorité pour CETTE ville.
  const cityScope = cityMatters ? usable.filter((v) => cityLabel(v) === city) : usable;
  const expList = dedupExp(cityScope);
  const current =
    expList.find((e) => e.experience === expLabel) ?? expList.find((e) => e.isDefault) ?? expList[0] ?? null;

  const showCity = cityMatters && cities.length >= 2;
  const showExp = (showCity && expList.length >= 1) || (!showCity && expList.length >= 2);
  const nationalNote = !isPerson && !showCity && !showExp;

  const total = current ? current.salaryTotalEur : item.salaryTotalEur;
  const fixed = (current ? current.salaryFixedEur : item.salaryFixedEur) ?? 0;
  const variable = (current ? current.salaryVariableEur : item.salaryVariableEur) ?? 0;
  const mainAmount = total ? perYear(total) : item.salaryDisplay;

  // Montant d'une ville (à la séniorité actuellement sélectionnée) pour le filtre ville.
  const cityAmount = (c: string): number | null => {
    const scope = usable.filter((v) => cityLabel(v) === c);
    const at = scope.find((v) => v.experience === current?.experience);
    const rep = at ?? scope.find((v) => v.isDefault) ?? scope[0];
    return rep?.salaryTotalEur ?? null;
  };
  const cityList = cityMatters
    ? [...new Set(usable.map(cityLabel))].sort((a, b) => (cityAmount(b) ?? 0) - (cityAmount(a) ?? 0))
    : [];

  const role = item.position || item.job;
  const loc = [...new Set([item.city, item.country].filter(Boolean))].join(", ");
  const subtitle = (isPerson
    ? [item.subCategory || item.category, item.country]
    : [role, item.company, showCity ? "" : loc]
  )
    .filter(Boolean)
    .join(" · ");

  const estLabel =
    "Revenu estimé" + (showCity ? ` · ${city}` : "") + (showExp && current ? ` · ${current.experience}` : "");

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,.04),0_28px_56px_-20px_rgba(15,23,42,.28)]">
      <style>{`@keyframes cjvFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}`}</style>
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${sv.color}, ${sv.color}00)` }} />
      <div className="p-6 md:p-8">
        {/* En-tête */}
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
            {subtitle && <p className="mt-1 text-[14px] leading-relaxed text-slate">{subtitle}</p>}
          </div>
        </div>

        {/* Revenu estimé — valorisé */}
        <div
          className="mt-5 rounded-2xl border border-line p-5 md:p-6"
          style={{ background: `linear-gradient(180deg, ${sv.tint}66, #FFFFFF 70%)` }}
        >
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate">{estLabel}</span>
          <div className="mt-1.5 max-w-full overflow-hidden whitespace-nowrap font-display text-[clamp(26px,5.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.025em] text-ink [font-variant-numeric:tabular-nums]">
            {mainAmount}
          </div>
          {fixed > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] leading-none">
                <span className="h-2 w-2 rounded-full bg-brand" />
                <span className="text-slate">Fixe</span>
                <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{eur(fixed)}</span>
              </span>
              {variable > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] leading-none">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#7C3AED" }} />
                  <span className="text-slate">Variable</span>
                  <span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{eur(variable)}</span>
                </span>
              )}
            </div>
          )}
          {nationalNote && <p className="mt-2 text-[12.5px] text-slate-soft">Estimation nationale</p>}
        </div>

        {/* 1) Filtre ville */}
        {showCity && (
          <Section title="Salaire par ville" icon={MapPin}>
            <div className="flex flex-wrap gap-2">
              {cityList.map((c) => {
                const active = c === city;
                const amt = cityAmount(c);
                return (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    aria-pressed={active}
                    className={`group/city inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      active
                        ? "border-brand bg-brand-tint shadow-[0_8px_20px_-10px_rgba(0,195,137,.6)] ring-1 ring-inset ring-brand/40"
                        : "border-line bg-white hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft"
                    }`}
                  >
                    <span className={`text-[13px] font-semibold ${active ? "text-brand-dark" : "text-ink"}`}>{c}</span>
                    {amt != null && <span className="whitespace-nowrap text-[12px] text-slate-soft [font-variant-numeric:tabular-nums]">{eur(amt)}</span>}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* 2) Grille de séniorité pour la ville sélectionnée */}
        {showExp && (
          <Section title={showCity ? `Salaire selon l'expérience · ${city}` : "Salaire selon l'expérience"}>
            <div
              key={city}
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
              style={{ animation: "cjvFade .25s ease" }}
            >
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
                      {lvl && (
                        <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] ${active ? "text-brand-dark" : "text-slate-soft"}`}>
                          {lvl}
                        </span>
                      )}
                      {lvl && <span className="shrink-0 text-[11px] text-slate-soft/70">·</span>}
                      <span className="truncate text-[11.5px] font-medium text-slate">{v.experience}</span>
                    </span>
                    <span className="mt-1.5 block whitespace-nowrap text-[14.5px] font-bold text-ink [font-variant-numeric:tabular-nums]">
                      {v.salaryTotalEur ? eur(v.salaryTotalEur) : "—"}
                      <span className="ml-1 text-[11px] font-normal text-slate-soft">/ an</span>
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
  const py = total ? `${eur(total)} par an` : "une estimation indicative";
  if (it.type === "personne_nom") {
    return total
      ? `${cleanName(it.displayName)} perçoit un revenu estimé à environ ${py}.`
      : `${cleanName(it.displayName)} : revenu estimé.`;
  }
  const role = lower1(it.position || it.job || "ce métier");
  const variable = it.salaryVariableEur && it.salaryVariableEur > 0;
  if (it.company) {
    return `Un ${role} chez ${it.company} peut atteindre environ ${py}${variable ? ", en combinant salaire fixe et bonus variable" : ""}.`;
  }
  return `Le métier de ${role} est estimé autour de ${py}.`;
}

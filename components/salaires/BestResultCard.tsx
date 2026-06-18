"use client";

import { useState } from "react";
import {
  Scale, Sparkles, BookOpen,
  Star, Briefcase, Banknote, HeartPulse, Cpu, Gavel, Lightbulb, Megaphone, Building2, Factory, Trophy, Landmark, MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SearchResultItem, GroupVariant } from "@/types/search";

/* ---------- helpers ---------- */
function cleanName(s: string) {
  return s.replace(/^salaires?\s+/i, "").trim() || s;
}
function eur(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
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
/** Vraie tranche de séniorité (exclut tranches d'âge INSEE « [59-63[ ans », vides, notoriété). */
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

/** Icône + couleur représentatives du secteur du métier (sigle visuel). */
export function sectorVisual(item: SearchResultItem): { Icon: LucideIcon; color: string; tint: string } {
  if (item.type === "personne_nom") return { Icon: Star, color: "#FF4D67", tint: "#FFE5EA" };
  const t = norm(`${item.category} ${item.subCategory} ${item.job} ${item.position}`);
  const has = (re: RegExp) => re.test(t);
  if (has(/banqu|financ|trading|trader|sales|bourse|march|investiss|audit|comptab|assurance|m&a|fusion|private equity|hedge/))
    return { Icon: Banknote, color: "#7C3AED", tint: "#EEE7FD" };
  if (has(/sante|medec|medic|soin|infirm|cardio|hopital|hospital|pharma|chirurg|dentiste|kine|veterinair/))
    return { Icon: HeartPulse, color: "#06B6D4", tint: "#DEF7FB" };
  if (has(/tech|data|develop|logiciel|software|machine learning|\bia\b|intellig|cyber|scientist|devops|cloud|informat|developpeur/))
    return { Icon: Cpu, color: "#00C389", tint: "#E1F7EF" };
  if (has(/droit|avocat|jurist|notaire|legal|justice|magistrat/))
    return { Icon: Gavel, color: "#2F6BFF", tint: "#EAF1FF" };
  if (has(/conseil|consultant|strateg|advisory/))
    return { Icon: Lightbulb, color: "#F59E0B", tint: "#FEF1D8" };
  if (has(/marketing|communicat|brand|growth|publicit|media|influence/))
    return { Icon: Megaphone, color: "#FF4D67", tint: "#FFE5EA" };
  if (has(/immobil|foncier|agent immo/))
    return { Icon: Building2, color: "#2F6BFF", tint: "#EAF1FF" };
  if (has(/industr|ingenieur|usine|mecaniq|energie|btp|construct|aeronaut|automobil|nucleair|chimie/))
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

function cityEntries(variants: GroupVariant[]): { city: string; total: number | null }[] {
  const map = new Map<string, GroupVariant[]>();
  for (const v of variants) {
    const k = cityLabel(v);
    const a = map.get(k);
    if (a) a.push(v);
    else map.set(k, [v]);
  }
  return [...map.entries()]
    .map(([city, vs]) => ({ city, total: (vs.find((x) => x.isDefault) ?? vs[0]).salaryTotalEur }))
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
}

/* ---------- composant ---------- */
export function BestResultCard({
  item,
  fallbackUsed,
}: {
  item: SearchResultItem;
  fallbackUsed: boolean;
}) {
  const sv = sectorVisual(item);
  const variants = item.groupVariants ?? [];
  const cityMatters = cityMattersFn(variants);

  const [city, setCity] = useState(item.city || item.country || "France");
  const [expLabel, setExpLabel] = useState(item.experience || "");

  const scope = cityMatters ? variants.filter((v) => cityLabel(v) === city) : variants;
  const expList = dedupExp((scope.length ? scope : variants).filter((v) => isRealXp(v.experience)));
  const hasExp = expList.length >= 2;
  const current =
    expList.find((e) => e.experience === expLabel) ?? expList.find((e) => e.isDefault) ?? expList[0] ?? null;

  // Valeurs affichées (tranche/ville sélectionnée, sinon l'item).
  const total = current ? current.salaryTotalEur : item.salaryTotalEur;
  const fixed = (current ? current.salaryFixedEur : item.salaryFixedEur) ?? 0;
  const variable = (current ? current.salaryVariableEur : item.salaryVariableEur) ?? 0;
  const mainAmount = total ? `${eur(total)} / an` : item.salaryDisplay;

  const isPerson = item.type === "personne_nom";
  const role = item.position || item.job;
  const loc = [...new Set([item.city, item.country].filter(Boolean))].join(", ");
  const subParts = isPerson
    ? [item.subCategory || item.category, item.country]
    : [role, item.company, cityMatters ? "" : loc];
  const subtitle = subParts.filter(Boolean).join(" · ");

  const estLabel =
    "Revenu estimé" +
    (cityMatters ? ` · ${city}` : "") +
    (hasExp && current ? ` · ${current.experience}` : "");

  const nationalNote = !isPerson && !hasExp && !cityMatters;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${sv.color}, ${sv.color}00)` }}
      />
      <div className="p-6 md:p-8">
        {/* En-tête : icône secteur + identité */}
        <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: sv.tint, color: sv.color }}
          >
            <sv.Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: sv.tint, color: sv.color }}
              >
                <span className="h-[6px] w-[6px] rounded-full" style={{ background: sv.color }} />
                {isPerson ? "Personnalité" : "Métier"}
              </span>
              {fallbackUsed && (
                <span className="text-[12px] font-medium text-slate-soft">Résultat le plus proche</span>
              )}
            </div>
            <h2 className="mt-2 font-display text-[clamp(22px,3.2vw,30px)] font-bold leading-[1.12] tracking-[-0.01em] text-ink">
              {cleanName(item.displayName)}
            </h2>
            {subtitle && <p className="mt-1 text-[14px] leading-relaxed text-slate">{subtitle}</p>}
          </div>
        </div>

        {/* Revenu estimé */}
        <div className="mt-5 rounded-2xl border border-line bg-surface p-5 md:p-6">
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate">{estLabel}</span>
          <div className="mt-1 max-w-full overflow-hidden whitespace-nowrap font-display text-[clamp(21px,5.2vw,38px)] font-bold leading-[1.05] tracking-[-0.02em] text-ink [font-variant-numeric:tabular-nums]">
            {mainAmount}
          </div>
          {fixed > 0 && variable > 0 && (
            <p className="mt-2.5 text-[14px] leading-relaxed text-slate">
              Fixe estimé&nbsp;: <span className="font-semibold text-ink">{eur(fixed)}</span>
              <span className="mx-2 text-slate-soft">·</span>
              Variable estimé&nbsp;: <span className="font-semibold text-ink">{eur(variable)}</span>
            </p>
          )}
          {fixed > 0 && variable === 0 && (
            <p className="mt-2.5 text-[14px] leading-relaxed text-slate">
              Salaire fixe&nbsp;: <span className="font-semibold text-ink">{eur(fixed)}</span>
            </p>
          )}
          {nationalNote && <p className="mt-2 text-[12.5px] text-slate-soft">Estimation nationale</p>}
        </div>

        {/* Salaire par ville (si le salaire dépend réellement de la ville) */}
        {cityMatters && (
          <Section title="Salaire par ville" icon={MapPin}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {cityEntries(variants).map((c) => {
                const active = c.city === city;
                return (
                  <Tile key={c.city} active={active} onClick={() => setCity(c.city)}>
                    <span className="block truncate text-[13px] font-semibold text-ink">{c.city}</span>
                    <span className="mt-1 block whitespace-nowrap text-[15px] font-bold tabular-nums text-ink">
                      {c.total ? eur(c.total) : "—"}
                    </span>
                    <span className="text-[11px] text-slate-soft">/ an</span>
                  </Tile>
                );
              })}
            </div>
          </Section>
        )}

        {/* Salaire selon l'expérience (dans la ville sélectionnée si pertinent) */}
        {hasExp && (
          <Section title={cityMatters ? `Salaire selon l'expérience · ${city}` : "Salaire selon l'expérience"}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {expList.map((v) => {
                const active = current?.experience === v.experience;
                const lvl = level(v.experience);
                return (
                  <Tile key={v.experience} active={active} onClick={() => setExpLabel(v.experience)}>
                    <span className="flex items-baseline justify-between gap-1">
                      {lvl && (
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                            active ? "text-brand-dark" : "text-slate-soft"
                          }`}
                        >
                          {lvl}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate">{v.experience}</span>
                    </span>
                    <span className="mt-1.5 block whitespace-nowrap text-[15px] font-bold tabular-nums text-ink">
                      {v.salaryTotalEur ? eur(v.salaryTotalEur) : "—"}
                    </span>
                    <span className="text-[11px] text-slate-soft">/ an</span>
                  </Tile>
                );
              })}
            </div>
          </Section>
        )}

        {/* Synthèse */}
        <p className="mt-6 max-w-[52ch] text-[15.5px] leading-[1.6] text-ink/80">{synthesize(item, total)}</p>

        {/* CTA */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
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
            <span className="font-semibold text-slate">Sources&nbsp;:</span> études de rémunération,
            données publiques et estimations marché agrégées.
          </span>
        </div>
      </div>
    </article>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
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

function Tile({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        active
          ? "border-brand bg-brand-tint shadow-[0_10px_24px_-12px_rgba(0,195,137,.6)]"
          : "border-line bg-white hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft"
      }`}
    >
      {children}
    </button>
  );
}

function synthesize(it: SearchResultItem, total: number | null): string {
  const perYear = total ? `${eur(total)} par an` : "une estimation indicative";
  if (it.type === "personne_nom") {
    return total
      ? `${cleanName(it.displayName)} perçoit un revenu estimé à environ ${perYear}.`
      : `${cleanName(it.displayName)} : revenu estimé.`;
  }
  const role = lower1(it.position || it.job || "ce métier");
  const variable = it.salaryVariableEur && it.salaryVariableEur > 0;
  if (it.company) {
    return `Un ${role} chez ${it.company} peut atteindre environ ${perYear}${
      variable ? ", en combinant salaire fixe et bonus variable" : ""
    }.`;
  }
  return `Le métier de ${role} est estimé autour de ${perYear}.`;
}

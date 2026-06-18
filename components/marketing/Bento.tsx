import { Search, BarChart3, TrendingUp, CalendarDays, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Gauge } from "@/components/ui/Gauge";
import { palette } from "@/lib/constants";

type CSSVars = React.CSSProperties & { [key: `--${string}`]: string | number };

const cardBase =
  "flex h-full flex-col rounded-[22px] border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(15,23,42,.06),0_34px_54px_-22px_rgba(15,23,42,.28)]";

function Pin({
  label,
  color,
  tint,
  icon: Icon,
  center,
}: {
  label: string;
  color: string;
  tint: string;
  icon?: LucideIcon;
  center?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-full px-2.5 py-[5px] text-[11.5px] font-bold text-ink ${center ? "self-center" : "self-start"}`}
      style={{ background: tint }}
    >
      {Icon ? (
        <Icon className="h-[13px] w-[13px]" style={{ color }} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}

function Badge({
  label,
  color,
  tint,
  className = "",
}: {
  label: string;
  color: string;
  tint: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${className}`}
      style={{ background: tint, color }}
    >
      {label}
    </span>
  );
}

function Bubble({
  initials,
  name,
  value,
  color,
  position,
  duration,
  delay,
}: {
  initials: string;
  name: string;
  value: string;
  color: string;
  position: string;
  duration: string;
  delay?: string;
}) {
  return (
    <div
      className={`float absolute z-[3] flex items-center gap-[9px] rounded-[14px] border border-line bg-white px-[13px] py-[9px] text-[13px] font-semibold shadow-[0_10px_36px_-12px_rgba(15,23,42,.22)] ${position}`}
      style={{ animationDuration: duration, animationDelay: delay } as CSSVars}
    >
      <span
        className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10.5px] font-bold text-white"
        style={{ background: color }}
      >
        {initials}
      </span>
      {name} <span className="font-normal text-slate">· {value}</span>
    </div>
  );
}

export function Bento() {
  return (
    <div className="relative mx-auto mt-[50px] max-w-[1140px]">
      <Bubble
        initials="M"
        name="Mbappé"
        value="26 M€/an"
        color={palette.coral.color}
        position="-top-[24px] right-[34px] hidden sm:flex"
        duration="6.5s"
      />
      <Bubble
        initials="EM"
        name="Emmanuel Macron"
        value="≈ 15 200 €/mois"
        color={palette.blue.color}
        position="bottom-[30px] -left-[26px] hidden sm:flex"
        duration="8s"
        delay=".5s"
      />
      <Bubble
        initials="C"
        name="Cardiologue libéral"
        value="≈ 9 200 €/mois"
        color={palette.cyan.color}
        position="top-[120px] -right-[30px] hidden lg:flex"
        duration="7.2s"
        delay=".3s"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-4">
        {/* SCORE (vert) — tall */}
        <div className="reveal lg:row-span-2" style={{ "--d": ".28s" } as CSSVars}>
          <div className={`${cardBase} items-center bg-gradient-to-b from-white to-[#F7FEFB] text-center`}>
            <Pin label="Combien je vaux ?" color={palette.green.color} tint={palette.green.tint} center />
            <div className="mt-3.5">
              <Gauge value={72} size={122} />
            </div>
            <div className="mt-3 text-[14.5px] font-bold">Score financier</div>
            <Badge
              label="Top 32 % des Français"
              color={palette.green.color}
              tint={palette.green.tint}
              className="mt-2.5"
            />
            <span className="mt-3.5 inline-flex items-center gap-[7px] text-[13.5px] font-bold text-brand-dark">
              Faire mon bilan <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* TRADER (cyan = résultat) */}
        <div className="reveal" style={{ "--d": ".34s" } as CSSVars}>
          <div className={cardBase}>
            <Pin label="Résultat" color={palette.cyan.color} tint={palette.cyan.tint} icon={Search} />
            <div className="mt-3 text-[14px] font-bold">Trader · Goldman Sachs</div>
            <div className="mt-0.5 font-display text-[22px] font-extrabold tracking-[-0.01em]">
              120k – 330k €<span className="text-[12px] font-semibold text-slate"> brut/an</span>
            </div>
            <div className="relative mt-3.5 h-2 rounded-lg bg-[#EEF2F7]">
              <div className="absolute left-0 top-0 h-full rounded-lg opacity-85" style={{ width: "96%", background: palette.cyan.color }} />
              <div
                className="absolute top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-white"
                style={{ left: "96%", borderColor: palette.cyan.color }}
              />
            </div>
            <div className="mt-auto flex items-center gap-2 pt-2.5">
              <Badge label="Top 1 %" color={palette.cyan.color} tint={palette.cyan.tint} />
              <small className="text-[11px] text-slate">de tous les salaires</small>
            </div>
          </div>
        </div>

        {/* COMPARAISON (bleu) */}
        <div className="reveal" style={{ "--d": ".4s" } as CSSVars}>
          <div className={cardBase}>
            <Pin label="Comparaison" color={palette.blue.color} tint={palette.blue.tint} icon={BarChart3} />
            <div className="mt-3 text-[12px] font-semibold text-slate">Vous vs les Français</div>
            <div className="mt-3 h-[9px] overflow-hidden rounded-[9px] bg-[#EEF2F7]">
              <div className="h-full rounded-[9px]" style={{ width: "68%", background: palette.blue.color }} />
            </div>
            <div className="mt-[9px] text-[12.5px] text-slate">
              Vous gagnez plus que <b className="text-ink">68 %</b> des actifs.
            </div>
            <Badge
              label="Top 32 %"
              color={palette.blue.color}
              tint={palette.blue.tint}
              className="mt-auto self-start"
            />
          </div>
        </div>

        {/* PATRIMOINE (violet) */}
        <div className="reveal" style={{ "--d": ".46s" } as CSSVars}>
          <div className={cardBase}>
            <Pin label="Patrimoine" color={palette.violet.color} tint={palette.violet.tint} icon={TrendingUp} />
            <div className="mt-3 text-[12px] font-semibold text-slate">Projeté à 60 ans</div>
            <div className="mt-0.5 font-display text-[26px] font-extrabold tracking-[-0.02em]">340 000 €</div>
            <svg className="mt-auto h-12 w-full pt-2" viewBox="0 0 200 48" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cjvAreaV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={palette.violet.color} stopOpacity="0.35" />
                  <stop offset="1" stopColor={palette.violet.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,40 C40,36 70,30 100,22 C130,15 160,12 200,6 L200,48 L0,48 Z" fill="url(#cjvAreaV)" />
              <path d="M0,40 C40,36 70,30 100,22 C130,15 160,12 200,6" fill="none" stroke={palette.violet.color} strokeWidth="2.4" />
            </svg>
          </div>
        </div>

        {/* SALAIRE MÉDIAN (vert) */}
        <div className="reveal" style={{ "--d": ".52s" } as CSSVars}>
          <div className={cardBase}>
            <Pin label="Salaire médian" color={palette.green.color} tint={palette.green.tint} />
            <div className="mt-3 text-[12px] font-semibold text-slate">Net · France 2026</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-display text-[26px] font-extrabold tracking-[-0.02em]">
                2 091 €<span className="text-[13px] font-semibold text-slate">/mois</span>
              </span>
              <span
                className="rounded-md px-2 py-0.5 text-[11.5px] font-bold"
                style={{ background: palette.green.tint, color: palette.green.color }}
              >
                +2,4 %
              </span>
            </div>
            <svg className="mt-auto h-10 w-full pt-2.5" viewBox="0 0 200 40" preserveAspectRatio="none">
              <polyline points="0,33 30,30 60,31 90,22 120,24 150,15 200,9" fill="none" stroke={palette.green.color} strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* RETRAITE / PROJECTION (orange) */}
        <div className="reveal" style={{ "--d": ".58s" } as CSSVars}>
          <div className={cardBase}>
            <Pin label="Retraite" color={palette.amber.color} tint={palette.amber.tint} icon={CalendarDays} />
            <div className="mt-3 text-[12px] font-semibold text-slate">Revenu estimé</div>
            <div className="mt-0.5 font-display text-[26px] font-extrabold tracking-[-0.02em]">
              2 480 €<span className="text-[13px] font-semibold text-slate">/mois</span>
            </div>
            <div className="mt-[9px] text-[12.5px] text-slate">
              Départ estimé à <b className="text-ink">62 ans</b>
            </div>
            <Badge
              label="−18 % vs aujourd'hui"
              color={palette.amber.color}
              tint={palette.amber.tint}
              className="mt-auto self-start"
            />
          </div>
        </div>

        {/* MINI-CLASSEMENT (corail) */}
        <div className="reveal" style={{ "--d": ".64s" } as CSSVars}>
          <div className={cardBase}>
            <Pin label="Les mieux payés" color={palette.coral.color} tint={palette.coral.tint} icon={Search} />
            <div className="mt-3 grid gap-2.5">
              {[
                ["1", "Chirurgien", "11 500 €"],
                ["2", "Pilote de ligne", "9 800 €"],
                ["3", "Avocat d'affaires", "8 900 €"],
                ["4", "Data scientist", "5 400 €"],
              ].map(([rank, name, val]) => (
                <div key={rank} className="flex items-center gap-[9px] text-[13px] font-semibold">
                  <span
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-md text-[11px]"
                    style={{ background: palette.coral.tint, color: palette.coral.color }}
                  >
                    {rank}
                  </span>
                  {name}
                  <span className="ml-auto font-display font-bold">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

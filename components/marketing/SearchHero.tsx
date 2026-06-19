import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SearchBarTyping } from "@/components/ui/SearchBarTyping";
import { HeroRotatingTitle } from "./HeroRotatingTitle";
import { Bento } from "./Bento";
import { searchExamples } from "@/lib/constants";

type CSSVars = React.CSSProperties & { [key: `--${string}`]: string | number };

const HERO_BG =
  "radial-gradient(820px 560px at 14% 0%, rgba(0,195,137,.26), transparent 56%), radial-gradient(760px 520px at 92% 8%, rgba(255,77,103,.20), transparent 58%), radial-gradient(960px 700px at 60% 118%, rgba(124,58,237,.24), transparent 60%), linear-gradient(180deg,#FFFFFF 0%,#EDF3FF 48%,#FBFCFF 100%)";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function SearchHero() {
  return (
    <section
      className="relative overflow-hidden px-[22px] pb-[92px] pt-[120px] text-center text-ink"
      style={{ background: HERO_BG }}
    >
      {/* formes graphiques colorées */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute left-[-110px] top-[-70px] h-[420px] w-[420px] rounded-full blur-[64px]" style={{ background: "rgba(0,195,137,.4)" }} />
        <div className="absolute right-[-70px] top-[10px] h-[340px] w-[340px] rounded-full blur-[64px]" style={{ background: "rgba(255,77,103,.28)" }} />
        <div className="absolute left-[40%] bottom-[-120px] h-[360px] w-[360px] rounded-full blur-[64px]" style={{ background: "rgba(124,58,237,.26)" }} />
        <div className="absolute right-[-170px] top-[-160px] h-[620px] w-[620px] rounded-full border-[1.5px] border-[#7C3AED]/[0.16]" />
        <div className="absolute left-[-120px] bottom-[-120px] h-[380px] w-[380px] rounded-full border-[1.5px] border-[#FF4D67]/[0.16]" />
        <div className="absolute left-[15%] top-[96px] h-[230px] w-[230px] rounded-full border-[1.5px] border-[#00C389]/20" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(15,23,42,.06) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            WebkitMaskImage: "radial-gradient(1000px 720px at 50% 22%, #000 0%, transparent 74%)",
            maskImage: "radial-gradient(1000px 720px at 50% 22%, #000 0%, transparent 74%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      </div>

      <div className="relative z-10">
        <span className="reveal inline-flex items-center gap-[11px] text-[12px] font-bold uppercase tracking-[0.18em] text-[#475569]">
          <span className="h-0.5 w-7 rounded-sm" style={{ background: "linear-gradient(90deg,#00C389,#FF4D67)" }} />
          Où vous situez-vous vraiment&nbsp;?
        </span>

        <HeroRotatingTitle />

        <p
          className="reveal mx-auto mt-5 max-w-[560px] text-balance text-[clamp(16px,2vw,19px)] leading-[1.55] text-slate"
          style={{ "--d": ".12s" } as CSSVars}
        >
          Trader, cardiologue, Mbappé ou data scientist : trouvez n&apos;importe quel
          salaire et comparez-vous à la France entière.
        </p>

        {/* Recherche centrale */}
        <div className="reveal mx-auto mt-8 max-w-[680px]" style={{ "--d": ".18s" } as CSSVars}>
          <SearchBarTyping />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13.5px] text-slate">
            <span>Essayez :</span>
            {searchExamples.map(({ label, color, icon: Icon }) => (
              <Link
                key={label}
                href={`/salaires?q=${encodeURIComponent(label)}`}
                className="inline-flex items-center gap-[7px] rounded-full border border-line bg-white px-[14px] py-[7px] font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:shadow-card"
              >
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA secondaire — bilan */}
        <div className="reveal mt-[26px]" style={{ "--d": ".24s" } as CSSVars}>
          <Link
            href="/combien-je-vaux"
            className="inline-flex items-center gap-[9px] rounded-[14px] border border-line bg-white/70 px-[18px] py-[11px] text-[15px] font-semibold text-ink transition hover:-translate-y-px hover:bg-white"
          >
            ou lancez votre bilan «&nbsp;Combien je vaux&nbsp;?&nbsp;»
            <ArrowRight className="h-[17px] w-[17px]" />
          </Link>
        </div>

        <Container>
          <Bento />
        </Container>
      </div>
    </section>
  );
}

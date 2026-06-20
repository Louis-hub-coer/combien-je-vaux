import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SalaireBackground } from "@/components/salaire/SalaireBackground";
import { salaireTools, salaireHub } from "@/lib/salaire-tools";

export const metadata: Metadata = {
  title: "Tous les outils salaire",
  description: salaireHub.subtitle,
};

export default function SalaireHubPage() {
  return (
    <section className="relative overflow-hidden">
      <SalaireBackground />

      <Container className="relative py-8 md:py-12">
        {/* Espace réservé invisible, calé sur le lien retour des autres pages -> badge à la MÊME hauteur, sans flèche. */}
        <span aria-hidden className="pointer-events-none inline-flex select-none items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-[13px] font-medium opacity-0">
          <span className="h-4 w-4" />Retour aux outils salaire
        </span>
        <header className="mx-auto mt-7 max-w-[760px] text-center">
          <span className="cjv-badge relative mb-3.5 inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate backdrop-blur">
            <span aria-hidden className="cjv-badge-halo" />
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative h-2.5 w-2.5 rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#7C3AED)", boxShadow: "0 0 8px rgba(0,195,137,.75)" }} />
            </span>
            Univers salaire
          </span>
          <h1 className="mx-auto max-w-[720px] text-balance text-[clamp(37px,5.4vw,62px)] font-extrabold leading-[1.05] tracking-[-0.032em] text-ink">
            Tous vos outils <span className="hl">salaire</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-balance text-[clamp(16px,2vw,19px)] leading-[1.55] text-slate">
            {salaireHub.subtitle}
          </p>
        </header>

        <div className="mx-auto mt-10 grid max-w-[920px] gap-4 sm:grid-cols-2 md:mt-12">
          {salaireTools.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={t.href}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white/85 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_70px_-34px_rgba(5,9,24,.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 opacity-70 transition group-hover:opacity-100" style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }} />
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100" style={{ boxShadow: `inset 0 0 0 1px ${t.color}40`, background: `radial-gradient(120% 75% at 50% 0%, ${t.color}12, transparent 70%)` }} />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110 group-hover:-rotate-3" style={{ background: t.tint, color: t.color }}>
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h2 className="relative mt-4 font-display text-[20px] font-bold tracking-[-0.01em] text-ink">{t.title}</h2>
                <p className="relative mt-1.5 flex-1 text-[14.5px] leading-[1.5] text-slate">{t.description}</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: t.color }}>
                  {t.cta}
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

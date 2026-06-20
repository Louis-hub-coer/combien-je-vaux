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
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white/85 p-6 backdrop-blur transition hover:-translate-y-[3px] hover:border-[#d7dceb] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 opacity-70"
                  style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }}
                />
                {!t.ready && (
                  <span className="absolute right-4 top-4 rounded-full border border-line bg-white/80 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-soft">
                    Bientôt
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105" style={{ background: t.tint, color: t.color }}>
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h2 className="mt-4 font-display text-[20px] font-bold tracking-[-0.01em] text-ink">{t.title}</h2>
                <p className="mt-1.5 flex-1 text-[14.5px] leading-[1.5] text-slate">{t.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: t.color }}>
                  {t.cta}
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SalaireBackground } from "@/components/salaire/SalaireBackground";
import { Comparateur } from "@/components/salaire/Comparateur";

export const metadata: Metadata = {
  title: "Comparateur de salaire : où se situe votre salaire ?",
  description:
    "Entrez votre salaire et découvrez les métiers, personnalités et profils qui ont un revenu proche du vôtre.",
};

export default function ComparateurPage() {
  return (
    <section className="relative overflow-hidden">
      <SalaireBackground />
      <div aria-hidden className="cjv-float-1 pointer-events-none absolute left-[8%] top-[-40px] -z-10 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.34)" }} />
      <div aria-hidden className="cjv-float-2 pointer-events-none absolute right-[6%] top-[10px] -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.30)" }} />
      {/* Éléments animés discrets (mouvement très lent, premium) */}
      <div aria-hidden className="cjv-drift-a pointer-events-none absolute left-[18%] top-[280px] -z-10 h-40 w-40 rounded-full blur-3xl" style={{ background: "rgba(47,107,255,.16)" }} />
      <div aria-hidden className="cjv-drift-b pointer-events-none absolute right-[14%] top-[520px] -z-10 h-48 w-48 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.14)" }} />
      <div aria-hidden className="cjv-drift-c pointer-events-none absolute left-[46%] top-[120px] -z-10 h-24 w-24 rounded-full blur-2xl" style={{ background: "rgba(124,58,237,.16)" }} />
      <div aria-hidden className="cjv-drift-a pointer-events-none absolute right-[28%] top-[760px] -z-10 h-2 w-2 rounded-full bg-brand/50 shadow-[0_0_12px_rgba(0,195,137,.7)]" />
      <div aria-hidden className="cjv-drift-b pointer-events-none absolute left-[30%] top-[640px] -z-10 h-1.5 w-1.5 rounded-full bg-[#7C3AED]/50 shadow-[0_0_10px_rgba(124,58,237,.7)]" />

      <Container className="relative py-8 md:py-12">
        <Link
          href="/salaire"
          className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-[13px] font-medium text-slate backdrop-blur transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Retour aux outils salaire
        </Link>

        <header className="mx-auto mt-7 max-w-[760px] text-center">
          <span className="cjv-badge relative mb-3.5 inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate backdrop-blur">
            <span aria-hidden className="cjv-badge-halo" />
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative h-2.5 w-2.5 rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#7C3AED)", boxShadow: "0 0 8px rgba(0,195,137,.75)" }} />
            </span>
            Comparateur salaire
          </span>
          <h1 className="mx-auto max-w-[720px] text-balance text-[clamp(37px,5.4vw,62px)] font-extrabold leading-[1.05] tracking-[-0.032em] text-ink">
            Où se situe <span className="hl">votre salaire</span> ?
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-balance text-[clamp(16px,2vw,19px)] leading-[1.55] text-slate">
            Entrez votre salaire et découvrez les profils juste au-dessus, juste en dessous, et votre position sur l’échelle des revenus.
          </p>
        </header>

        <div className="mt-9 md:mt-11">
          <Comparateur />
        </div>
      </Container>
    </section>
  );
}

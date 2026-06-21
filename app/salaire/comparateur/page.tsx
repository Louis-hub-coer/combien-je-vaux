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
      {/* Halos (plus présents) */}
      <div aria-hidden className="cjv-float-1 pointer-events-none absolute left-[6%] top-[-50px] -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.42)" }} />
      <div aria-hidden className="cjv-float-2 pointer-events-none absolute right-[5%] top-[10px] -z-10 h-80 w-80 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.38)" }} />
      <div aria-hidden className="cjv-drift-a pointer-events-none absolute left-[16%] top-[300px] -z-10 h-56 w-56 rounded-full blur-3xl" style={{ background: "rgba(47,107,255,.24)" }} />
      <div aria-hidden className="cjv-drift-b pointer-events-none absolute right-[12%] top-[560px] -z-10 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.20)" }} />
      <div aria-hidden className="cjv-drift-c pointer-events-none absolute left-[44%] top-[120px] -z-10 h-36 w-36 rounded-full blur-2xl" style={{ background: "rgba(124,58,237,.22)" }} />
      {/* Trajectoires animées (premium, discrètes) */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.5]" preserveAspectRatio="none" viewBox="0 0 1200 900">
        <defs>
          <linearGradient id="cjvTrace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00C389" stopOpacity="0" />
            <stop offset="0.5" stopColor="#2F6BFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="cjv-trace" d="M-50 220 C 250 120, 480 320, 720 200 S 1150 120, 1280 260" fill="none" stroke="url(#cjvTrace)" strokeWidth="2" />
        <path className="cjv-trace-2" d="M-50 640 C 220 560, 460 720, 700 600 S 1100 540, 1280 660" fill="none" stroke="url(#cjvTrace)" strokeWidth="1.6" />
      </svg>
      {/* Particules lumineuses */}
      <div aria-hidden className="cjv-spark pointer-events-none absolute right-[26%] top-[240px] -z-10 h-2 w-2 rounded-full bg-brand shadow-[0_0_14px_rgba(0,195,137,.9)]" />
      <div aria-hidden className="cjv-spark pointer-events-none absolute left-[28%] top-[470px] -z-10 h-1.5 w-1.5 rounded-full bg-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,.9)]" style={{ animationDelay: "1.5s" }} />
      <div aria-hidden className="cjv-spark pointer-events-none absolute right-[40%] top-[700px] -z-10 h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shadow-[0_0_12px_rgba(47,107,255,.9)]" style={{ animationDelay: "3s" }} />

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
            Notre outil de comparaison de salaire
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

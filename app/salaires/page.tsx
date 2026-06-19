import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SalarySearch } from "@/components/salaires/SalarySearch";
import { SalairesFunBackground } from "@/components/salaires/SalairesFunBackground";

export const metadata: Metadata = {
  title: "Rechercher un salaire",
  description:
    "Métiers, personnalités, secteurs : tapez une recherche et obtenez une estimation claire, avec les résultats proches.",
};

export default function SalairesPage() {
  return (
    <section className="relative overflow-hidden">
      {/* Base claire légèrement teintée (toute la hauteur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#ECF1FF 20%,#EAF0FB 50%,#EEF2FC 78%,#F3F6FB 100%)" }}
      />
      {/* Halos vifs répartis sur toute la page (mêmes couleurs, plus présentes) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(36% 32% at 12% 3%, rgba(0,195,137,.48), transparent 60%)," +
            "radial-gradient(36% 32% at 88% 1%, rgba(124,58,237,.46), transparent 62%)," +
            "radial-gradient(32% 26% at 54% 6%, rgba(255,77,103,.30), transparent 60%)," +
            "radial-gradient(32% 28% at 1% 38%, rgba(47,107,255,.30), transparent 60%)," +
            "radial-gradient(34% 28% at 101% 44%, rgba(0,195,137,.30), transparent 60%)," +
            "radial-gradient(30% 24% at 50% 50%, rgba(124,58,237,.16), transparent 62%)," +
            "radial-gradient(32% 26% at 6% 74%, rgba(124,58,237,.28), transparent 62%)," +
            "radial-gradient(34% 28% at 97% 80%, rgba(255,77,103,.28), transparent 60%)," +
            "radial-gradient(42% 30% at 50% 100%, rgba(47,107,255,.28), transparent 64%)",
        }}
      />
      {/* Blobs flous (haut, milieu, bas) */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-16 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.6)", opacity: 0.62 }} />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.55)", opacity: 0.58 }} />
      <div aria-hidden className="pointer-events-none absolute right-[-60px] top-[42%] -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(47,107,255,.45)", opacity: 0.48 }} />
      <div aria-hidden className="pointer-events-none absolute left-[-70px] top-[64%] -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.4)", opacity: 0.46 }} />
      <div aria-hidden className="pointer-events-none absolute bottom-[4%] left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" style={{ background: "rgba(255,77,103,.34)", opacity: 0.42 }} />
      {/* Grille de points (bande haute, discrète) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px]"
        style={{
          backgroundImage: "radial-gradient(rgba(15,23,42,.09) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(72% 70% at 50% 0%, #000, transparent 76%)",
          WebkitMaskImage: "radial-gradient(72% 70% at 50% 0%, #000, transparent 76%)",
        }}
      />

      {/* Couche animée : bulles de salaires flottantes + particules (ludique, premium) */}
      <SalairesFunBackground />
      <span aria-hidden className="cjv-spark2 pointer-events-none absolute left-[20%] top-[26%] -z-10 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_12px_rgba(0,195,137,.9)]" />
      <span aria-hidden className="cjv-spark2 pointer-events-none absolute right-[22%] top-[34%] -z-10 h-1.5 w-1.5 rounded-full bg-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,.9)]" style={{ animationDelay: "2s" }} />
      <span aria-hidden className="cjv-spark2 pointer-events-none absolute left-[26%] top-[68%] -z-10 h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shadow-[0_0_12px_rgba(47,107,255,.9)]" style={{ animationDelay: "3.5s" }} />

      <Container className="relative py-8 md:py-12">
        {/* Lien retour discret */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-[13px] font-medium text-slate backdrop-blur transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Accueil
        </Link>

        <header className="mx-auto mt-6 max-w-[700px] text-center">
          <span className="cjv-badge relative mb-3.5 inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate backdrop-blur">
            <span aria-hidden className="cjv-badge-halo" />
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span
                className="relative h-2.5 w-2.5 rounded-full"
                style={{ background: "linear-gradient(90deg,#00C389,#7C3AED)", boxShadow: "0 0 8px rgba(0,195,137,.75)" }}
              />
            </span>
            Moteur de salaires
          </span>
          <h1 className="mx-auto max-w-[720px] text-balance text-[clamp(37px,5.4vw,62px)] font-extrabold leading-[1.05] tracking-[-0.032em] text-ink">
            Rechercher <span className="hl">un salaire</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-balance text-[clamp(16px,2vw,19px)] leading-[1.55] text-slate">
            Métiers, personnalités, secteurs : tapez une recherche et obtenez une
            estimation claire, avec les résultats proches.
          </p>
        </header>

        <div className="mt-9 md:mt-11">
          <SalarySearch />
        </div>
      </Container>
    </section>
  );
}

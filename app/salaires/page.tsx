import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SalarySearch } from "@/components/salaires/SalarySearch";

export const metadata: Metadata = {
  title: "Rechercher un salaire",
  description:
    "Métiers, entreprises, personnalités : tapez une recherche et obtenez une estimation claire, avec les résultats proches.",
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
            "radial-gradient(34% 30% at 12% 3%, rgba(0,195,137,.40), transparent 60%)," +
            "radial-gradient(34% 30% at 88% 1%, rgba(124,58,237,.38), transparent 62%)," +
            "radial-gradient(30% 24% at 54% 6%, rgba(255,77,103,.24), transparent 60%)," +
            "radial-gradient(30% 26% at 2% 40%, rgba(47,107,255,.22), transparent 60%)," +
            "radial-gradient(32% 26% at 100% 46%, rgba(0,195,137,.22), transparent 60%)," +
            "radial-gradient(30% 24% at 8% 74%, rgba(124,58,237,.20), transparent 62%)," +
            "radial-gradient(34% 26% at 96% 80%, rgba(255,77,103,.20), transparent 60%)," +
            "radial-gradient(40% 28% at 50% 100%, rgba(47,107,255,.20), transparent 64%)",
        }}
      />
      {/* Blobs flous (haut, milieu, bas) */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-16 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.6)", opacity: 0.55 }} />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.55)", opacity: 0.5 }} />
      <div aria-hidden className="pointer-events-none absolute right-[-60px] top-[42%] -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(47,107,255,.45)", opacity: 0.4 }} />
      <div aria-hidden className="pointer-events-none absolute left-[-70px] top-[64%] -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.4)", opacity: 0.38 }} />
      <div aria-hidden className="pointer-events-none absolute bottom-[4%] left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" style={{ background: "rgba(255,77,103,.34)", opacity: 0.34 }} />
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
          <span className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-line/80 bg-white/70 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate backdrop-blur">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#7C3AED)" }} />
            Moteur de salaires
          </span>
          <h1 className="font-display text-[clamp(31px,5.2vw,50px)] font-bold leading-[1.03] tracking-[-0.02em] text-ink">
            Rechercher <span className="hl">un salaire</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[560px] text-[clamp(15px,2vw,17.5px)] leading-[1.55] text-slate">
            Métiers, entreprises, personnalités : tapez une recherche et obtenez une
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

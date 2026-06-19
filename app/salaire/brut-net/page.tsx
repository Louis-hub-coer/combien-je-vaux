import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SalaireBackground } from "@/components/salaire/SalaireBackground";
import { BrutNetCalculator } from "@/components/salaire/BrutNetCalculator";

export const metadata: Metadata = {
  title: "Salaire brut ↔ net : convertir en quelques secondes",
  description:
    "Estimez votre net mensuel, votre net après impôt et le coût employeur à partir de votre salaire brut (ou inversement). Simulation indicative 2026.",
};

export default function BrutNetPage() {
  return (
    <section className="relative overflow-hidden">
      <SalaireBackground />

      <Container className="relative py-8 md:py-12">
        <Link
          href="/salaire"
          className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-[13px] font-medium text-slate backdrop-blur transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Retour aux outils salaire
        </Link>

        <header className="mx-auto mt-7 max-w-[720px] text-center">
          <span className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-line/80 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate backdrop-blur">
            Outil salaire
          </span>
          <h1 className="mx-auto max-w-[680px] text-balance text-[clamp(32px,5.2vw,56px)] font-extrabold leading-[1.06] tracking-[-0.032em] text-ink">
            Convertissez votre <span className="hl">brut en net</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[580px] text-balance text-[clamp(16px,2vw,19px)] leading-[1.55] text-slate">
            Estimez votre net mensuel, votre net après impôt et le coût employeur en quelques secondes.
          </p>
        </header>

        <div className="mt-9 md:mt-11">
          <BrutNetCalculator />
        </div>
      </Container>
    </section>
  );
}

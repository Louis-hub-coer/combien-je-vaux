import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SalaireBackground } from "@/components/salaire/SalaireBackground";
import { salaireTools } from "@/lib/salaire-tools";

/**
 * Page outil « préparée » (placeholder premium) : en-tête clair, illustration,
 * mention « en préparation », CTA vers le moteur + le hub, et un rappel des
 * autres outils. Pas de logique métier à ce stade (étape navigation).
 */
export function ToolPlaceholder({ toolKey }: { toolKey: string }) {
  const tool = salaireTools.find((t) => t.key === toolKey) ?? salaireTools[0];
  const Icon = tool.icon;
  const others = salaireTools.filter((t) => t.key !== tool.key);

  return (
    <section className="relative overflow-hidden">
      <SalaireBackground />

      <Container className="relative py-8 md:py-14">
        <Link
          href="/salaire"
          className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-[13px] font-medium text-slate backdrop-blur transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Tous les outils salaire
        </Link>

        <div className="mx-auto mt-8 max-w-[620px] text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-soft" style={{ background: tool.tint, color: tool.color }}>
            <Icon className="h-8 w-8" aria-hidden />
          </span>
          <span className="mt-5 inline-block rounded-full border border-line/80 bg-white/70 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate backdrop-blur">
            En préparation
          </span>
          <h1 className="mt-4 font-display text-[clamp(30px,5vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
            {tool.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[470px] text-[16px] leading-[1.55] text-slate">{tool.description}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button href="/salaires">Rechercher un salaire</Button>
            <Button href="/salaire" variant="ghost">Tous les outils salaire</Button>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-[760px]">
          <p className="mb-3 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-soft">Autres outils salaire</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {others.map((t) => {
              const OIcon = t.icon;
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-white/85 p-3.5 backdrop-blur transition hover:-translate-y-[2px] hover:border-[#d7dceb] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: t.tint, color: t.color }}>
                    <OIcon className="h-[17px] w-[17px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-[13.5px] font-semibold leading-tight text-ink">{t.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-soft transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

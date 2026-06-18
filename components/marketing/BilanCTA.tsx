import { Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const items = [
  "Votre score financier sur 100",
  "Votre position face aux Français",
  "Votre projection à 10, 20 et 30 ans",
  "Votre âge de départ à la retraite estimé",
];

export function BilanCTA() {
  return (
    <section className="border-y border-line bg-white py-[76px]">
      <Container>
        <div className="bilan-aurora relative grid items-center gap-11 overflow-hidden rounded-3xl p-12 text-white md:grid-cols-[1.2fr_.8fr]">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-[clamp(26px,4vw,32px)] font-bold text-white">
              Votre salaire est-il dans la moyenne… ou très loin au-dessus ?
            </h2>
            <p className="mb-[22px] mt-3 text-[16px] text-white/85">
              Répondez à quelques questions, obtenez votre photo financière
              complète.
            </p>
            <div className="grid gap-3 text-[15.5px]">
              {items.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-7">
              <Button href="/combien-je-vaux" variant="light">
                Commencer mon bilan
                <ArrowRight className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/20 bg-white/10 p-[26px] text-center">
            <div className="font-display text-[54px] font-extrabold leading-none">
              72<span className="text-[20px] opacity-70"> / 100</span>
            </div>
            <div className="mt-1 text-[13px] opacity-85">Score financier</div>
            <div className="mb-2.5 mt-[18px] h-2 overflow-hidden rounded-lg bg-white/20">
              <div className="h-full w-[72%] rounded-lg bg-white" />
            </div>
            <small className="text-[13px] opacity-85">
              Devant 68 % des Français
            </small>
          </div>
        </div>
      </Container>
    </section>
  );
}

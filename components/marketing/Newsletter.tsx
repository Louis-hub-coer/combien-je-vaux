import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function Newsletter() {
  return (
    <section className="py-[76px]">
      <Container>
        <div className="news-aurora relative overflow-hidden rounded-3xl border border-white/10 p-12 text-center text-white">
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full blur-[20px]"
            style={{ background: "radial-gradient(closest-side, rgba(0,195,137,.35), transparent)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-20 h-[320px] w-[320px] rounded-full blur-[20px]"
            style={{ background: "radial-gradient(closest-side, rgba(255,77,103,.3), transparent)" }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-[clamp(24px,4vw,28px)] font-bold text-white">
              Une meilleure idée chaque semaine pour votre argent.
            </h2>
            <p className="mx-auto mt-2.5 max-w-[460px] text-[#AEB6CE]">
              Pas de jargon, pas de spam. Une seule idée actionnable, le dimanche.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <input
                type="email"
                placeholder="votre@email.com"
                aria-label="Votre adresse email"
                className="w-[300px] rounded-xl border border-white/15 bg-white/[0.08] px-[18px] py-3 text-[15px] text-white outline-none transition placeholder:text-slate-soft focus:border-brand"
              />
              <Button>S&apos;inscrire</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

import { Container } from "@/components/ui/Container";
import { SectionHead } from "./SectionHead";
import { valueProps } from "@/lib/constants";

export function ValueCards() {
  return (
    <section className="border-y border-line bg-white py-[76px]">
      <Container>
        <SectionHead
          kicker="Pourquoi Combien je vaux ?"
          title="Comprendre, comparer, décider — sans jargon."
        />
        <div className="grid gap-[18px] md:grid-cols-3">
          {valueProps.map(({ title, text, icon: Icon, color, tint }) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-white p-[26px] shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <div
                className="mb-[18px] flex h-12 w-12 items-center justify-center rounded-[14px]"
                style={{ background: tint, color }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-[19px] font-semibold">{title}</h3>
              <p className="mt-2 text-[15px] text-slate">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

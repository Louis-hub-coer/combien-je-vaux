import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHead } from "./SectionHead";
import { popularQuestions } from "@/lib/constants";

export function PopularQuestions() {
  return (
    <section className="py-[76px]">
      <Container>
        <SectionHead
          kicker="Questions populaires"
          title="Ce que cherchent les Français."
        />
        <div className="flex flex-wrap gap-3">
          {popularQuestions.map(({ label, href, color, tint }) => (
            <Link
              key={label}
              href={href}
              className="inline-flex items-center gap-2.5 rounded-full border border-transparent px-[17px] py-2.5 text-[14.5px] font-semibold text-ink transition hover:-translate-y-0.5"
              style={{ background: tint, borderColor: "transparent" }}
            >
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: color }}
              />
              {label}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

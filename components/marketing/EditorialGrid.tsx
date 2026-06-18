import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHead } from "./SectionHead";
import { featuredArticles } from "@/lib/constants";

export function EditorialGrid() {
  return (
    <section className="border-y border-line bg-white py-[76px]">
      <Container>
        <SectionHead kicker="Questions d'argent" title="Les articles les plus lus." />
        <div className="grid gap-[18px] md:grid-cols-3">
          {featuredArticles.map(({ tag, title, minutes, href, icon: Icon, color, tint }) => (
            <Link
              key={title}
              href={href}
              className="group overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <div
                className="relative flex h-[148px] items-center justify-center"
                style={{ background: tint }}
              >
                <Icon className="h-[46px] w-[46px] opacity-55" style={{ color }} strokeWidth={1.6} />
              </div>
              <div className="px-5 pb-[22px] pt-[18px]">
                <span
                  className="inline-flex items-center gap-[7px] rounded-full px-2.5 py-1 text-xs font-semibold text-ink"
                  style={{ background: tint }}
                >
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
                  {tag}
                </span>
                <h3 className="mb-1.5 mt-3 font-display text-[17px] font-semibold">
                  {title}
                </h3>
                <div className="text-[13px] text-slate">Lecture {minutes} min</div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

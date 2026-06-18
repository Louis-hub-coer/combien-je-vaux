import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHead } from "./SectionHead";
import { popularTools } from "@/lib/constants";

export function ToolGrid() {
  return (
    <section className="py-[76px]">
      <Container>
        <SectionHead
          kicker="Les outils"
          title="Les questions que vous vous posez vraiment."
          text="Une page, une question, une réponse claire. Et la suite logique juste après."
        />
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {popularTools.map(({ name, href, icon: Icon, color, tint }) => (
            <Link
              key={name}
              href={href}
              className="group flex items-center gap-3.5 rounded-[14px] border border-line bg-white px-[18px] py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <span
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                style={{ background: tint, color }}
              >
                <Icon className="h-[21px] w-[21px]" />
              </span>
              <span className="flex-1 text-[15px] font-semibold">{name}</span>
              <ArrowRight className="h-[18px] w-[18px] text-slate-soft transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

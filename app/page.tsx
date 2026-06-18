import { SearchHero } from "@/components/marketing/SearchHero";
import { ValueCards } from "@/components/marketing/ValueCards";
import { ToolGrid } from "@/components/marketing/ToolGrid";
import { BilanCTA } from "@/components/marketing/BilanCTA";
import { PopularQuestions } from "@/components/marketing/PopularQuestions";
import { EditorialGrid } from "@/components/marketing/EditorialGrid";
import { Newsletter } from "@/components/marketing/Newsletter";
import { Reveal } from "@/components/ui/Reveal";

export default function HomePage() {
  return (
    <>
      <SearchHero />
      <Reveal>
        <ValueCards />
      </Reveal>
      <Reveal>
        <ToolGrid />
      </Reveal>
      <Reveal>
        <BilanCTA />
      </Reveal>
      <Reveal>
        <PopularQuestions />
      </Reveal>
      <Reveal>
        <EditorialGrid />
      </Reveal>
      <Reveal>
        <Newsletter />
      </Reveal>
    </>
  );
}

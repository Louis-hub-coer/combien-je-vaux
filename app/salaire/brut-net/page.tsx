import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/salaire/ToolPlaceholder";

export const metadata: Metadata = {
  title: "Salaire brut ↔ net",
  description: "Convertissez un salaire brut en net, et inversement, en quelques secondes.",
};

export default function BrutNetPage() {
  return <ToolPlaceholder toolKey="brut-net" />;
}

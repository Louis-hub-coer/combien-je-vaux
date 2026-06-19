import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/salaire/ToolPlaceholder";

export const metadata: Metadata = {
  title: "Comparer mon salaire",
  description: "Entrez votre salaire et découvrez quels métiers et personnalités gagnent comme vous.",
};

export default function ComparateurPage() {
  return <ToolPlaceholder toolKey="comparateur" />;
}

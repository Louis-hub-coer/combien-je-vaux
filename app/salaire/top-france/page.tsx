import type { Metadata } from "next";
import { ToolPlaceholder } from "@/components/salaire/ToolPlaceholder";

export const metadata: Metadata = {
  title: "Suis-je dans le top 10 % ?",
  description: "Situez votre salaire dans la distribution française : médiane, top 10 %, top 1 %.",
};

export default function TopFrancePage() {
  return <ToolPlaceholder toolKey="top-france" />;
}

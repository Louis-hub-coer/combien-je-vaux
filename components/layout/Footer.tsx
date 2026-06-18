import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const columns = [
  {
    title: "Outils",
    links: [
      { label: "Salaire", href: "/salaire" },
      { label: "Immobilier", href: "/immobilier" },
      { label: "Crédit", href: "/credit" },
      { label: "Investissement", href: "/investissement" },
    ],
  },
  {
    title: "Questions",
    links: [
      { label: "Suis-je riche ?", href: "/questions-argent/suis-je-riche" },
      { label: "Patrimoine par âge", href: "/questions-argent/patrimoine-age" },
      { label: "Retraite anticipée", href: "/retraite/retraite-anticipee" },
    ],
  },
  {
    title: "À propos",
    links: [
      { label: "Notre mission", href: "/mission" },
      { label: "Contact", href: "/contact" },
      { label: "Newsletter", href: "/newsletter" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink py-14 text-slate-soft">
      <div className="mx-auto max-w-container px-6">
        <div className="flex flex-wrap justify-between gap-10 border-b border-white/10 pb-8">
          <div className="max-w-[260px]">
            <Logo className="text-white" />
            <p className="mt-3.5 text-sm">
              La référence française pour comprendre, simplement, votre argent.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-14 gap-y-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-3.5 font-display text-sm font-semibold text-white">
                  {col.title}
                </h4>
                {col.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="mb-2 block text-sm transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-4 text-[13px]">
          <span>
            © 2026 Combien je vaux. Outils d&apos;information, pas de conseil financier.
          </span>
          <span>Mentions légales · Confidentialité</span>
        </div>
      </div>
    </footer>
  );
}

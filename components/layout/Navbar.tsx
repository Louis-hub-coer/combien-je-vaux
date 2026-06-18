"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { navItems } from "@/lib/constants";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] px-4 pt-4">
      <nav className="mx-auto grid h-16 max-w-container grid-cols-[1fr_auto_1fr] items-center rounded-[20px] border border-ink/[0.06] bg-white/90 py-2.5 pl-[18px] pr-3 shadow-[0_12px_40px_-16px_rgba(5,9,24,0.4)] backdrop-blur-md">
        <Link href="/" aria-label="Combien je vaux, accueil" className="justify-self-start text-ink">
          <Logo />
        </Link>

        <div className="hidden justify-self-center lg:flex lg:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-[13px] py-2 text-[14.5px] font-medium text-slate transition hover:bg-surface hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            href="/connexion"
            className="hidden rounded-xl px-3.5 py-2.5 text-[14.5px] font-semibold text-ink transition hover:bg-surface sm:block"
          >
            Connexion
          </Link>
          <div className="hidden sm:block">
            <Button href="/combien-je-vaux" size="sm">
              Combien je vaux ?
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:bg-surface lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-container rounded-[20px] border border-line bg-white p-4 shadow-card lg:hidden">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink transition hover:bg-surface"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid gap-2">
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-line px-4 py-3 text-center text-[15px] font-semibold text-ink transition hover:bg-surface"
            >
              Connexion
            </Link>
            <Button href="/combien-je-vaux" className="w-full">
              Combien je vaux ?
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

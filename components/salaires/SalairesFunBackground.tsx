"use client";

import { useEffect, useState } from "react";

// Étiquettes attractives qui flottent en arrière-plan (montants indicatifs).
const TAGS = [
  "Trader · 130 000 €", "Data scientist · 75 000 €", "Mbappé · 82 M€", "Boulanger · 24 000 €",
  "Cardiologue · 140 000 €", "IShowSpeed · 9 M€", "Avocat · 80 000 €", "Infirmier · 35 000 €",
  "Pilote de ligne · 110 000 €", "Squeezie · 6 M€", "Éboueur · 26 000 €", "Médecin · 98 000 €",
  "Pharmacien · 70 000 €", "Contrôleur SNCF · 32 000 €", "Notaire · 120 000 €", "Professeur · 30 000 €",
  "Ronaldo · 200 M€", "Commercial · 55 000 €", "Plombier · 38 000 €", "Chirurgien · 180 000 €",
];
const COLORS = ["#00A06E", "#2F6BFF", "#7C3AED", "#E11D48"];

interface Bubble { id: number; text: string; color: string; left: number; top: number; dur: number; op: number; }

export function SalairesFunBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    let id = 0;
    let alive = true;
    const spawn = () => {
      if (!alive) return;
      const onLeft = Math.random() < 0.5;
      // Bandes latérales : on évite la colonne centrale (recherche).
      const left = onLeft ? 3 + Math.random() * 19 : 78 + Math.random() * 19;
      const top = 12 + Math.random() * 72;
      const dur = 6500 + Math.random() * 3500;
      const b: Bubble = {
        id: id++,
        text: TAGS[Math.floor(Math.random() * TAGS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        left, top, dur,
        op: 0.42 + Math.random() * 0.2,
      };
      setBubbles((prev) => [...prev.slice(-5), b]);
      setTimeout(() => setBubbles((prev) => prev.filter((x) => x.id !== b.id)), dur + 200);
    };
    // Démarrage léger puis cadence régulière.
    const kick = setTimeout(spawn, 600);
    const iv = setInterval(spawn, 1700);
    return () => { alive = false; clearTimeout(kick); clearInterval(iv); };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="cjv-bubble absolute whitespace-nowrap rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-[12.5px] font-semibold shadow-[0_8px_24px_-12px_rgba(15,23,42,.35)] backdrop-blur-sm [font-variant-numeric:tabular-nums]"
          style={{ left: `${b.left}%`, top: `${b.top}%`, color: b.color, ["--dur" as string]: `${b.dur}ms`, ["--o" as string]: b.op }}
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}

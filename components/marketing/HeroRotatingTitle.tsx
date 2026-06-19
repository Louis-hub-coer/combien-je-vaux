"use client";

import { useEffect, useRef, useState } from "react";

type CSSVars = React.CSSProperties & { [key: `--${string}`]: string | number };

// Chaque entrée a une catégorie -> on évite de regrouper deux mêmes catégories à la suite
// (pas toutes les célébrités collées, pas les religieux collés, etc.).
type Cat = "foot" | "creator" | "music" | "cinema" | "politique" | "sport" | "business" | "metier" | "public" | "finance" | "sante" | "religion";
const ITEMS: { t: string; c: Cat }[] = [
  // Football / sport stars
  { t: "de Mbappé", c: "foot" }, { t: "de Cristiano Ronaldo", c: "foot" }, { t: "de Lionel Messi", c: "foot" }, { t: "de Neymar", c: "foot" },
  { t: "d’Antoine Dupont", c: "sport" }, { t: "de Teddy Riner", c: "sport" }, { t: "de Léon Marchand", c: "sport" },
  // Créateurs
  { t: "d’IShowSpeed", c: "creator" }, { t: "d’Inoxtag", c: "creator" }, { t: "de Squeezie", c: "creator" }, { t: "de Léna Situations", c: "creator" }, { t: "de Mister V", c: "creator" }, { t: "de McFly et Carlito", c: "creator" },
  // Musique
  { t: "de Taylor Swift", c: "music" }, { t: "de Drake", c: "music" }, { t: "de Beyoncé", c: "music" },
  // Cinéma
  { t: "de Matt Damon", c: "cinema" }, { t: "de Brad Pitt", c: "cinema" }, { t: "de Zendaya", c: "cinema" },
  // Business
  { t: "d’Elon Musk", c: "business" }, { t: "de Bernard Arnault", c: "business" },
  // Politique
  { t: "d’Emmanuel Macron", c: "politique" }, { t: "de Marine Le Pen", c: "politique" }, { t: "de Marine Tondelier", c: "politique" },
  // Métiers populaires / manuels
  { t: "d’un éboueur", c: "metier" }, { t: "d’un boulanger", c: "metier" }, { t: "d’un électricien", c: "metier" }, { t: "d’un plombier", c: "metier" },
  // Public / service
  { t: "d’un professeur", c: "public" }, { t: "d’un contrôleur SNCF", c: "public" }, { t: "d’un ASVP", c: "public" }, { t: "d’un maire", c: "public" }, { t: "d’un ministre", c: "public" },
  // Finance / tech
  { t: "d’un trader", c: "finance" }, { t: "d’un data scientist", c: "finance" },
  // Santé / droit
  { t: "d’un cardiologue", c: "sante" }, { t: "d’un avocat", c: "sante" }, { t: "d’un pharmacien", c: "sante" },
  // Religion
  { t: "d’un prêtre", c: "religion" }, { t: "d’un imam", c: "religion" }, { t: "d’un rabbin", c: "religion" },
];

/** Mélange (Fisher-Yates) puis réarrange pour éviter deux catégories identiques adjacentes. */
function spreadShuffle(items: { t: string; c: Cat }[]): string[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Anti-adjacence : si voisin de même catégorie, on échange avec un élément plus loin.
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].c === arr[i - 1].c) {
      for (let k = i + 1; k < arr.length; k++) {
        if (arr[k].c !== arr[i - 1].c && (k + 1 >= arr.length || arr[k].c !== arr[i + 1]?.c)) {
          [arr[i], arr[k]] = [arr[k], arr[i]];
          break;
        }
      }
    }
  }
  return arr.map((x) => x.t);
}

/** Titre du hero : base fixe + phrase qui s'écrit / s'efface (effet premium). */
export function HeroRotatingTitle() {
  const [text, setText] = useState("");
  const [reduce, setReduce] = useState(false);
  const order = useRef<string[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      setText("de n’importe qui");
      return;
    }
    order.current = spreadShuffle(ITEMS);
    let i = 0;
    let j = 0;
    let del = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const list = order.current;
      const w = list[i];
      if (!del) {
        j++;
        if (j >= w.length) {
          del = true;
          setText(w);
          t = setTimeout(tick, 1500);
          return;
        }
      } else {
        j--;
        if (j <= 0) {
          del = false;
          i = i + 1;
          if (i >= list.length) {
            // Nouveau mélange à chaque tour complet -> ordre toujours différent.
            order.current = spreadShuffle(ITEMS);
            i = 0;
          }
          j = 0;
          setText("");
          t = setTimeout(tick, 300);
          return;
        }
      }
      setText(w.slice(0, Math.max(j, 0)));
      t = setTimeout(tick, del ? 26 : 55);
    };
    t = setTimeout(tick, 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <h1
      className="reveal mx-auto mt-5 max-w-[820px] text-balance text-[clamp(37px,5.4vw,62px)] font-extrabold leading-[1.05] tracking-[-0.032em]"
      style={{ "--d": ".06s" } as CSSVars}
    >
      Cherchez le salaire
      {/* Ligne animée : hauteur fixe (min-h) + centrage vertical -> aucun décalage quand le mot change. */}
      <span className="mt-1 flex min-h-[1.18em] items-center justify-center whitespace-nowrap leading-[1.1]">
        <span className="hl">{text}</span>
        {!reduce && <span className="cjv-caret" />}
      </span>
    </h1>
  );
}

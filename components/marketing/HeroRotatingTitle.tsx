"use client";

import { useEffect, useState } from "react";

type CSSVars = React.CSSProperties & { [key: `--${string}`]: string | number };

/** Variations dynamiques de la partie « … salaire <de/d'…> » du titre homepage.
 *  prêtre / imam / rabbin sont insérés à des positions espacées (jamais à la suite). */
const PHRASES = [
  "d’un électricien",
  "de Mbappé",
  "d’un prêtre",
  "d’un contrôleur SNCF",
  "d’un éboueur",
  "d’un imam",
  "d’un trader",
  "d’un data scientist",
  "d’un cardiologue",
  "d’un rabbin",
  "d’un boulanger",
  "d’un maire",
  "d’un ministre",
  "d’un prof de sport",
  "d’IShowSpeed",
  "de Ronaldo",
  "de n’importe qui",
];

/** Titre du hero : base fixe + phrase qui s'écrit / s'efface (effet premium). */
export function HeroRotatingTitle() {
  const [text, setText] = useState("");
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      setText("de n’importe qui");
      return;
    }
    let i = 0;
    let j = 0;
    let del = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const w = PHRASES[i];
      if (!del) {
        j++;
        if (j >= w.length) {
          del = true;
          setText(w);
          t = setTimeout(tick, 1600);
          return;
        }
      } else {
        j--;
        if (j <= 0) {
          del = false;
          i = (i + 1) % PHRASES.length;
          j = 0;
          setText("");
          t = setTimeout(tick, 320);
          return;
        }
      }
      setText(w.slice(0, Math.max(j, 0)));
      t = setTimeout(tick, del ? 28 : 58);
    };
    t = setTimeout(tick, 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <h1
      className="reveal mx-auto mt-5 max-w-[760px] text-balance text-[clamp(37px,5.4vw,62px)] font-extrabold leading-[1.05] tracking-[-0.032em]"
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

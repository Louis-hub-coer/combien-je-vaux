"use client";

import { useEffect, useState } from "react";

// Les deux phrases ont EXACTEMENT la même longueur (11 caractères) -> largeur
// identique -> aucun espace parasite. On les superpose et on fait un fondu doux.
const PHRASES = ["brut en net", "net en brut"];

export function BrutNetTitleSwap() {
  const [i, setI] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      return;
    }
    const id = setInterval(() => setI((v) => (v + 1) % PHRASES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      Convertissez votre{" "}
      <span className="relative inline-block whitespace-nowrap align-baseline">
        {/* Sizer invisible : réserve une largeur fixe (identique pour les deux phrases). */}
        <span className="invisible">brut en net</span>
        {PHRASES.map((p, idx) => (
          <span
            key={p}
            className="hl"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              whiteSpace: "nowrap",
              transition: "opacity .55s ease",
              opacity: reduce ? (idx === 0 ? 1 : 0) : i === idx ? 1 : 0,
            }}
          >
            {p}
          </span>
        ))}
      </span>
    </>
  );
}

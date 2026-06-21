"use client";

import { useEffect, useState } from "react";

// Même longueur (11 caractères) -> largeur identique, aucun décalage.
const PHRASES = ["brut en net", "net en brut"];

export function BrutNetTitleSwap() {
  const [i, setI] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { setReduce(true); return; }
    const id = setInterval(() => setI((v) => (v + 1) % PHRASES.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      Convertissez votre{" "}
      <span className="relative inline-block whitespace-nowrap align-baseline">
        {/* Gabarit invisible : fige la largeur (identique pour les deux phrases). */}
        <span className="invisible">brut en net</span>
        {PHRASES.map((p, idx) => {
          const active = reduce ? idx === 0 : i === idx;
          return (
            <span
              key={p}
              className="hl"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                whiteSpace: "nowrap",
                transition: "opacity .6s cubic-bezier(.4,0,.2,1), transform .6s cubic-bezier(.4,0,.2,1), filter .6s cubic-bezier(.4,0,.2,1)",
                opacity: active ? 1 : 0,
                transform: active ? "translateY(0)" : "translateY(0.26em)",
                filter: active ? "blur(0px)" : "blur(5px)",
                willChange: "opacity, transform, filter",
              }}
            >
              {p}
            </span>
          );
        })}
      </span>
    </>
  );
}

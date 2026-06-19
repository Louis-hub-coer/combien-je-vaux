"use client";

import { useEffect, useState } from "react";

const PHRASES = ["brut en net", "net en brut"];

/** Partie dynamique du hero : alterne « brut en net » / « net en brut » (fondu doux). */
export function BrutNetTitleSwap() {
  const [i, setI] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      return;
    }
    const id = setInterval(() => setI((v) => (v + 1) % PHRASES.length), 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      Convertissez votre{" "}
      <span className="relative inline-block align-baseline">
        {/* Sizer invisible : réserve la largeur (les deux phrases ont la même longueur). */}
        <span className="invisible whitespace-nowrap">brut en net</span>
        {PHRASES.map((p, idx) => (
          <span
            key={p}
            className="cjv-grad whitespace-nowrap"
            style={{
              position: "absolute",
              inset: 0,
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

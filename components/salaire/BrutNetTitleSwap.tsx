"use client";

import { useEffect, useState } from "react";

/** Mot dynamique : alterne en fondu doux entre deux états (largeur réservée). */
function SwapWord({ a, b, i, reduce }: { a: string; b: string; i: number; reduce: boolean }) {
  const sizer = a.length >= b.length ? a : b;
  return (
    <span className="relative inline-block align-baseline">
      <span className="invisible whitespace-nowrap">{sizer}</span>
      {[a, b].map((w, idx) => (
        <span
          key={w}
          className="hl whitespace-nowrap"
          style={{ position: "absolute", inset: 0, transition: "opacity .6s ease", opacity: reduce ? (idx === 0 ? 1 : 0) : i === idx ? 1 : 0 }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

/**
 * « Convertissez votre {brut/net} en {net/brut} ».
 * Seuls les deux mots alternent ; « Convertissez votre » et « en » restent fixes.
 */
export function BrutNetTitleSwap() {
  const [i, setI] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      return;
    }
    const id = setInterval(() => setI((v) => (v + 1) % 2), 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      Convertissez votre <SwapWord a="brut" b="net" i={i} reduce={reduce} /> en{" "}
      <SwapWord a="net" b="brut" i={i} reduce={reduce} />
    </>
  );
}

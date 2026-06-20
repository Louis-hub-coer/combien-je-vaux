"use client";

import { useEffect, useState } from "react";

const NUMS = ["1", "5", "10", "20", "50"];

// Un SEUL chiffre, en flux normal (hérite la couleur violette de .hl).
// Le changement de `key` remonte le <span> -> l'animation CSS rejoue.
// -> jamais vide, jamais concaténé ("50201051"), parfaitement intégré à "top  %".
export function TopTitleSwap() {
  const [idx, setIdx] = useState(0); // démarre sur "1"

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = setInterval(() => setIdx((v) => (v + 1) % NUMS.length), 1700);
    return () => clearInterval(id);
  }, []);

  return (
    <span key={idx} className="cjv-topnum">{NUMS[idx]}</span>
  );
}

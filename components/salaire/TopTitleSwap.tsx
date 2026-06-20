"use client";

import { useEffect, useState } from "react";

const NUMS = ["50", "20", "10", "5", "1"];

// Chiffre animé pour le titre « Suis-je dans le top X % ? » (hérite la couleur .hl du parent).
export function TopTitleSwap() {
  const [i, setI] = useState(2); // démarre sur "10"
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { setReduce(true); return; }
    const id = setInterval(() => setI((v) => (v + 1) % NUMS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block align-baseline" style={{ minWidth: "1.7em" }}>
      <span className="invisible">50</span>
      {NUMS.map((n, idx) => (
        <span key={n} aria-hidden={!(reduce ? idx === 2 : i === idx)}
          style={{ position: "absolute", left: 0, right: 0, textAlign: "center", transition: "opacity .5s ease, transform .5s ease", opacity: reduce ? (idx === 2 ? 1 : 0) : i === idx ? 1 : 0, transform: i === idx ? "translateY(0)" : "translateY(-0.1em)" }}>
          {n}
        </span>
      ))}
    </span>
  );
}

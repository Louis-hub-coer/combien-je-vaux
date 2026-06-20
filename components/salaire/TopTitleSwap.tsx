"use client";

import { useEffect, useState } from "react";

const NUMS = ["50", "20", "10", "5", "1"];

// Deux chiffres SUPERPOSÉS qui se croisent en fondu : il y en a TOUJOURS un visible.
// -> jamais de "top  %" (trou), jamais de "50201051" (concaténation).
export function TopTitleSwap() {
  const [idx, setIdx] = useState(2); // "10"
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      return;
    }
    const id = setInterval(() => setIdx((v) => (v + 1) % NUMS.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block text-center align-baseline" style={{ minWidth: "1.6em" }}>
      {/* Sizer invisible : réserve la largeur du plus grand chiffre ("50"). */}
      <span className="invisible">50</span>
      {NUMS.map((n, i) => (
        <span
          key={n}
          aria-hidden={idx !== i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            textAlign: "center",
            transition: "opacity .42s ease, transform .42s ease",
            opacity: reduce ? (i === 2 ? 1 : 0) : idx === i ? 1 : 0,
            transform: reduce || idx === i ? "translateY(0)" : "translateY(-0.12em)",
          }}
        >
          {n}
        </span>
      ))}
    </span>
  );
}

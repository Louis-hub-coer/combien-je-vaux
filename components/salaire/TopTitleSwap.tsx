"use client";

import { useEffect, useState } from "react";

const SEQ = ["1", "5", "10", "20", "50"];
const CELLS = [...SEQ, SEQ[0]]; // clone du 1er en fin -> boucle vers l'avant sans retour arrière

// Odomètre vertical : une roulette de chiffres qui défile vers le haut.
// -> il y a TOUJOURS un chiffre visible, jamais de vide ni de concaténation,
//    et le défilement est continu/premium (pas un fondu bricolé).
export function TopTitleSwap() {
  const [pos, setPos] = useState(0);     // 0..CELLS.length-1
  const [anim, setAnim] = useState(true);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { setReduce(true); return; }
    const id = setInterval(() => setPos((p) => p + 1), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (reduce) return;
    if (pos === SEQ.length) {
      // on affiche le clone "1" -> une fois le défilement fini, on recale sur 0 sans animation
      const t = setTimeout(() => { setAnim(false); setPos(0); }, 640);
      return () => clearTimeout(t);
    }
    if (!anim) {
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
      return () => cancelAnimationFrame(r);
    }
  }, [pos, anim, reduce]);

  if (reduce) return <span>1</span>;

  return (
    <span className="cjv-odo" aria-label={`top ${SEQ[pos % SEQ.length]} %`}>
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          transform: `translateY(-${(pos * 100) / CELLS.length}%)`,
          transition: anim ? "transform .62s cubic-bezier(.22,1,.36,1)" : "none",
        }}
      >
        {CELLS.map((n, i) => (
          <span key={i} className="cjv-odo-cell">{n}</span>
        ))}
      </span>
    </span>
  );
}

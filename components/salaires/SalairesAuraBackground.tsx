// Fond animé premium pour /salaires : halos qui respirent, trajectoires douces, particules.
// Pas de bulles textuelles. Aucune dépendance JS (animations CSS pures).
export function SalairesAuraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Halos qui respirent (profondeur) */}
      <div className="cjv-breath absolute left-[10%] top-[14%] h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.30)", ["--o" as string]: 0.5 }} />
      <div className="cjv-breath absolute right-[10%] top-[20%] h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.28)", ["--o" as string]: 0.46, animationDelay: "1.4s" }} />
      <div className="cjv-orbit absolute left-[40%] top-[40%] h-56 w-56 rounded-full blur-3xl" style={{ background: "rgba(47,107,255,.22)" }} />
      <div className="cjv-breath absolute left-[16%] top-[64%] h-60 w-60 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.20)", ["--o" as string]: 0.4, animationDelay: "2.6s" }} />
      <div className="cjv-breath absolute right-[14%] top-[70%] h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.18)", ["--o" as string]: 0.38, animationDelay: "0.8s" }} />

      {/* Trajectoires / courbes dynamiques */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.55]" preserveAspectRatio="none" viewBox="0 0 1200 1000">
        <defs>
          <linearGradient id="cjvAura1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00C389" stopOpacity="0" />
            <stop offset="0.5" stopColor="#2F6BFF" stopOpacity="0.6" />
            <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cjvAura2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7C3AED" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FF4D67" stopOpacity="0.45" />
            <stop offset="1" stopColor="#00C389" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="cjv-trace" d="M-60 240 C 240 130, 470 330, 720 210 S 1150 130, 1280 280" fill="none" stroke="url(#cjvAura1)" strokeWidth="2" />
        <path className="cjv-trace-2" d="M-60 560 C 220 470, 470 640, 720 520 S 1120 470, 1280 600" fill="none" stroke="url(#cjvAura2)" strokeWidth="1.6" />
        <path className="cjv-trace" d="M-60 820 C 260 740, 500 900, 760 780 S 1140 740, 1280 860" fill="none" stroke="url(#cjvAura1)" strokeWidth="1.4" style={{ animationDuration: "32s" }} />
      </svg>

      {/* Particules discrètes */}
      <span className="cjv-spark absolute left-[22%] top-[28%] h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_12px_rgba(0,195,137,.9)]" />
      <span className="cjv-spark absolute right-[24%] top-[36%] h-1.5 w-1.5 rounded-full bg-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,.9)]" style={{ animationDelay: "1.6s" }} />
      <span className="cjv-spark absolute left-[30%] top-[60%] h-1 w-1 rounded-full bg-[#2F6BFF] shadow-[0_0_10px_rgba(47,107,255,.9)]" style={{ animationDelay: "3s" }} />
      <span className="cjv-spark absolute right-[34%] top-[66%] h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_12px_rgba(0,195,137,.9)]" style={{ animationDelay: "4.2s" }} />
    </div>
  );
}

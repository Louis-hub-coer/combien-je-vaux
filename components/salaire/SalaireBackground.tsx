/**
 * Fond premium partagé pour l'univers /salaire (hub + pages outils).
 * Même langage visuel que /salaires (halos, blobs, grille de points) pour la
 * cohérence avec la homepage. Purement décoratif.
 */
export function SalaireBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#ECF1FF 20%,#EAF0FB 50%,#EEF2FC 78%,#F3F6FB 100%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(36% 32% at 12% 3%, rgba(0,195,137,.42), transparent 60%)," +
            "radial-gradient(36% 32% at 88% 1%, rgba(124,58,237,.40), transparent 62%)," +
            "radial-gradient(32% 26% at 54% 6%, rgba(255,77,103,.26), transparent 60%)," +
            "radial-gradient(32% 28% at 1% 40%, rgba(47,107,255,.26), transparent 60%)," +
            "radial-gradient(34% 28% at 101% 46%, rgba(0,195,137,.26), transparent 60%)," +
            "radial-gradient(30% 24% at 50% 52%, rgba(124,58,237,.14), transparent 62%)," +
            "radial-gradient(42% 30% at 50% 100%, rgba(47,107,255,.24), transparent 64%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-16 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(0,195,137,.55)", opacity: 0.55 }} />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(124,58,237,.5)", opacity: 0.5 }} />
      <div aria-hidden className="pointer-events-none absolute right-[-60px] top-[44%] -z-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "rgba(47,107,255,.4)", opacity: 0.42 }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px]"
        style={{
          backgroundImage: "radial-gradient(rgba(15,23,42,.09) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(72% 70% at 50% 0%, #000, transparent 76%)",
          WebkitMaskImage: "radial-gradient(72% 70% at 50% 0%, #000, transparent 76%)",
        }}
      />
    </>
  );
}

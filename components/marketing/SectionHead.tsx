export function SectionHead({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mb-9 max-w-[680px]">
      <div className="mb-3 flex items-center gap-2.5 text-[12.5px] font-bold uppercase tracking-[0.12em] text-credit">
        <span className="h-0.5 w-[22px] rounded-sm" style={{ background: "linear-gradient(90deg,#00C389,#FF4D67)" }} />
        {kicker}
      </div>
      <h2 className="text-[clamp(28px,4vw,38px)] font-bold">{title}</h2>
      {text && <p className="mt-2.5 text-[16.5px] text-slate">{text}</p>}
    </div>
  );
}

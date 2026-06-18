type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

export function Logo({ size = 30, withWordmark = true, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-[11px] ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="cjvLogoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#34E0AE" />
            <stop offset="1" stopColor="#00A878" />
          </linearGradient>
        </defs>
        <path
          d="M32.56 23.36 A13 13 0 1 1 25.49 8.22"
          fill="none"
          stroke="url(#cjvLogoGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="29" cy="11" r="3.2" fill="currentColor" />
      </svg>
      {withWordmark && (
        <span className="flex flex-col font-display leading-none">
          <span className="text-[12px] font-semibold tracking-[0.02em] opacity-60">
            combien je
          </span>
          <span className="mt-px text-[21px] font-extrabold tracking-[-0.02em]">
            vaux<span className="text-brand">.</span>
          </span>
        </span>
      )}
    </span>
  );
}

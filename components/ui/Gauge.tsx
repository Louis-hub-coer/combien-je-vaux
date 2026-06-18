export function Gauge({
  value = 72,
  size = 128,
}: {
  value?: number;
  size?: number;
}) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
        <defs>
          <linearGradient id="cjvGaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#34E0AE" />
            <stop offset="1" stopColor="#00A878" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#EDF1F7" strokeWidth="13" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#cjvGaugeGrad)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold leading-none"
          style={{ fontSize: Math.round(size * 0.3) }}
        >
          {value}
        </span>
        <span className="mt-0.5 text-xs text-slate">/ 100</span>
      </div>
    </div>
  );
}

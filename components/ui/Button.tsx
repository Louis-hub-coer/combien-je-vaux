import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "light";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition active:scale-[.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-ink shadow-brand hover:bg-brand-dark",
  ghost: "bg-white text-ink border border-line hover:bg-surface",
  light: "bg-white text-ink hover:bg-[#F1FBF7]",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-[15px]",
  sm: "px-4 py-2.5 text-sm",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
  ...rest
}: CommonProps & { href?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

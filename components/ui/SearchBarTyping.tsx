"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SALARY_SEARCH_PLACEHOLDER } from "@/lib/constants";

const EXAMPLES = [
  "Mbappé",
  "Trader",
  "Cardiologue",
  "Contrôleur SNCF",
  "IShowSpeed",
  "Data scientist",
  "ASVP",
  "Boulanger",
  "Maire",
  "Ministre",
  "Cristiano Ronaldo",
  "Éboueur",
  "Prof de sport",
];

export function SearchBarTyping() {
  const router = useRouter();
  const [text, setText] = useState(""); // texte animé (sert de placeholder visuel)
  const [value, setValue] = useState(""); // saisie réelle de l'utilisateur
  const [focused, setFocused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animation de saisie (placeholder) — identique à l'existant.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      setText(SALARY_SEARCH_PLACEHOLDER);
      return;
    }
    let i = 0;
    let j = 0;
    let del = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const w = EXAMPLES[i];
      if (!del) {
        j++;
        if (j >= w.length) {
          del = true;
          setText(w);
          timer = setTimeout(tick, 1500);
          return;
        }
      } else {
        j--;
        if (j <= 0) {
          del = false;
          i = (i + 1) % EXAMPLES.length;
          j = 0;
          setText("");
          timer = setTimeout(tick, 360);
          return;
        }
      }
      setText(w.slice(0, Math.max(j, 0)));
      timer = setTimeout(tick, del ? 32 : 62);
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);

  // Soumission : trim, ignore le vide, redirige vers /salaires?q=...
  const submit = () => {
    const q = value.trim();
    if (!q) return;
    router.push(`/salaires?q=${encodeURIComponent(q)}`);
  };

  const showPlaceholder = value === "" && !focused;

  return (
    <form
      role="search"
      aria-label="Rechercher un salaire"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-3 rounded-[18px] border border-line bg-white py-[9px] pl-[18px] pr-[9px] shadow-[0_4px_10px_rgba(15,23,42,.05),0_30px_60px_-26px_rgba(0,195,137,.5)] transition hover:border-[#bfe7da] hover:shadow-[0_6px_14px_rgba(15,23,42,.07),0_36px_64px_-24px_rgba(0,195,137,.6)]"
    >
      <Search className="h-[22px] w-[22px] shrink-0 text-slate" />
      <span className="relative flex min-w-0 flex-1 items-center overflow-hidden text-left text-[16.5px]">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          type="search"
          inputMode="search"
          autoComplete="off"
          aria-label="Rechercher un salaire"
          className="min-w-0 flex-1 bg-transparent font-medium text-ink outline-none placeholder:text-transparent [&::-webkit-search-cancel-button]:appearance-none"
        />
        {showPlaceholder && (
          <span className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap">
            <span className={`overflow-hidden text-ellipsis ${reduce ? "text-[#94A3B8]" : "font-medium text-ink"}`}>
              {text}
            </span>
            {!reduce && <span className="cjv-caret" />}
          </span>
        )}
      </span>
      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-brand px-[22px] py-[13px] text-[16px] font-semibold text-ink shadow-[0_12px_26px_-10px_rgba(0,195,137,.55)] transition hover:bg-brand-dark"
      >
        Rechercher
      </button>
    </form>
  );
}

import { rotatingWords } from "@/lib/constants";

/** Mot animé en CSS pur (fondu enchaîné). Le plus long mot sert de gabarit. */
export function AnimatedWord() {
  const longest = rotatingWords.reduce(
    (a, b) => (b.word.length > a.length ? b.word : a),
    ""
  );
  return (
    <span className="rot">
      <span className="sizer">{longest}</span>
      {rotatingWords.map(({ word, color }) => (
        <span key={word} className="w" style={{ color }}>
          {word}
        </span>
      ))}
    </span>
  );
}

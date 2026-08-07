import { useCallback, useEffect, useState } from "react";
import { siteConfig } from "@/config/site-config";

function randomTerm() {
  const { minimo, massimo } = siteConfig.verificaUmana;
  const lo = Math.max(0, Math.min(minimo, massimo));
  const hi = Math.max(minimo, massimo);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function newChallenge() {
  const count = Math.max(2, siteConfig.verificaUmana.addendi);
  return Array.from({ length: count }, randomTerm);
}

/**
 * Verifica umana senza captcha esterni: l'utente risolve una semplice somma.
 * Chiama `onSolved(true)` solo quando il risultato è corretto.
 */
export function MathHumanCheck({
  label,
  onSolved,
  resetKey = 0,
}: {
  label: string;
  onSolved: (solved: boolean) => void;
  resetKey?: number;
}) {
  const [terms, setTerms] = useState<number[]>([]);
  const [answer, setAnswer] = useState("");

  const regenerate = useCallback(() => {
    setTerms(newChallenge());
    setAnswer("");
  }, []);

  useEffect(() => {
    regenerate();
  }, [resetKey, regenerate]);

  const expected = terms.reduce((a, b) => a + b, 0);
  const solved = terms.length > 0 && answer.trim() !== "" && Number(answer) === expected;

  useEffect(() => {
    onSolved(solved);
  }, [solved, onSolved]);

  if (terms.length === 0) return null;

  return (
    <div className="grid gap-1 text-sm font-semibold">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-secondary px-3 py-2 font-mono text-base">
          {terms.join(" + ")} =
        </span>
        <input
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/[^0-9-]/g, ""))}
          aria-label={label}
          className="w-24 rounded-xl border border-input bg-background px-3 py-2 text-base font-normal"
        />
        <button
          type="button"
          onClick={regenerate}
          className="rounded-xl border border-border px-3 py-2 text-xs font-semibold"
          aria-label="Nuova somma"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
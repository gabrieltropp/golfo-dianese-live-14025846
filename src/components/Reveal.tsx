import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card che entra in scena con un ingresso deciso ma fluido (salita +
 * leggero scale-in + dissolvenza), scandito da un piccolo ritardo in base
 * alla posizione della card nella pagina — così più card che compaiono
 * insieme (tipico su schermi più alti) entrano "una dopo l'altra" invece
 * che tutte insieme.
 *
 * A differenza della versione precedente, l'animazione parte UNA sola
 * volta quando la card entra nel viewport (IntersectionObserver, soglia
 * fissa) invece di restare agganciata in continuo alla posizione di
 * scroll: risultato più "vistoso" e leggero per il thread principale su
 * mobile (nessun ricalcolo ad ogni frame di scroll).
 */
export function Reveal({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);

    return () => io.disconnect();
  }, []);

  // Ritardo scandito ma limitato: mai più di 3 "scatti" di attesa, così una
  // card in fondo alla pagina raggiunta con uno scroll veloce non resta
  // ferma mezzo secondo prima di comparire.
  const delayMs = Math.min(index, 3) * 90;

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "is-in", className)}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

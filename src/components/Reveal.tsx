import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card che entra in scena "fluttuante e obliqua" e si raddrizza in modo
 * legato allo scroll. Per rendere il movimento più fluido e meno "sensibile"
 * ai piccoli scroll:
 *  - c'è una zona morta iniziale prima che l'animazione inizi
 *  - serve più distanza di scroll per completare il reveal
 *  - il progress è smussato con un lerp per evitare scatti.
 * Anima solo transform/opacity e, una volta dritta, non torna mai obliqua.
 */
export function Reveal({
  index = 0,
  className,
  onDone,
  children,
}: {
  index?: number;
  className?: string;
  onDone?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const smoothRef = useRef(0);
  const targetRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      setDone(true);
      onDone?.();
      return;
    }

    let raf = 0;
    let finished = false;
    const DEAD_ZONE = 0.22; // % di viewport che la card deve entrare prima che inizi l'animazione
    const SCROLL_SPAN = 1.35; // fattore di distanza extra richiesto per completare (1 = una viewport)
    const LERP = 0.075; // fattore di smorzamento (più basso = più lento/fluido)

    const compute = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const start = vh * DEAD_ZONE;
      const total = Math.max(vh * 0.5, vh * SCROLL_SPAN);
      const travelled = vh - rect.top;

      let p = 0;
      if (travelled > start) {
        p = Math.min(1, Math.max(0, (travelled - start) / (total - start)));
      }

      targetRef.current = p;

      if (p >= 1 && !finished) {
        finished = true;
        smoothRef.current = 1;
        setProgress(1);
        setDone(true);
        onDone?.();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    const smoothLoop = () => {
      const prev = smoothRef.current;
      const next = prev + (targetRef.current - prev) * LERP;
      if (Math.abs(next - prev) > 0.0005 || targetRef.current >= 1) {
        smoothRef.current = next;
        setProgress(next);
        raf = requestAnimationFrame(smoothLoop);
      } else {
        raf = 0;
      }
    };

    const onScroll = () => {
      compute();
      if (!raf) raf = requestAnimationFrame(smoothLoop);
    };

    compute();
    raf = requestAnimationFrame(smoothLoop);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rot = index % 2 === 0 ? 9 : -10;
  const p = done ? 1 : progress;
  const eased = 1 - Math.pow(1 - p, 3);

  return (
    <div
      ref={ref}
      className={cn("reveal", done && "is-in", className)}
      style={
        done
          ? undefined
          : ({
              transform: `translateY(${(1 - eased) * 70}px) rotate(${(1 - eased) * rot}deg)`,
              opacity: 0.35 + eased * 0.65,
            } as React.CSSProperties)
      }
    >
      {children}
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card che entra in scena "fluttuante e obliqua" e si raddrizza in modo
 * legato allo scroll (serve ~una schermata intera per completare).
 * Anima solo transform/opacity e, una volta dritta, non torna mai obliqua.
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
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      setDone(true);
      return;
    }

    let raf = 0;
    let finished = false;

    const compute = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 quando il bordo alto della card entra dal fondo,
      // 1 dopo circa una schermata intera di scroll.
      // completa quando il centro della card raggiunge il centro dello schermo
      const total = Math.max(1, vh / 2 + rect.height / 2);
      const travelled = vh - rect.top;
      const p = Math.min(1, Math.max(0, travelled / total));
      setProgress(p);
      if (p >= 1 && !finished) {
        finished = true;
        setDone(true);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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

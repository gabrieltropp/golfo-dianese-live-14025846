import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card che entra in scena con una leggera salita (traslazione verticale) e
 * dissolvenza, legata allo scroll (serve ~una schermata intera per
 * completare). Nessuna rotazione: solo transform (translate) e opacity.
 *
 * Il calcolo legato allo scroll si attiva solo mentre la card è realmente
 * vicina al viewport (via IntersectionObserver), invece di tenere un
 * listener di scroll globale sempre attivo per ogni card della pagina —
 * evita che più card insieme saturino il thread principale su mobile.
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
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      doneRef.current = true;
      setProgress(1);
      setDone(true);
      return;
    }

    let raf = 0;
    let listening = false;

    const finish = () => {
      doneRef.current = true;
      setDone(true);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    const compute = () => {
      raf = 0;
      if (doneRef.current) return; // guardia extra: mai ricalcolare dopo il traguardo
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 quando il bordo alto della card entra dal fondo,
      // 1 dopo circa una schermata intera di scroll.
      const travelled = vh - rect.top;
      const p = Math.min(1, Math.max(0, travelled / (vh * 0.92)));
      setProgress(p);
      if (p >= 1) finish();
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    // Ascolta lo scroll globale solo mentre la card è vicina al viewport:
    // niente listener permanenti per ogni card su tutta la pagina.
    const io = new IntersectionObserver(
      (entries) => {
        const near = entries.some((entry) => entry.isIntersecting);
        if (near && !listening) {
          listening = true;
          compute();
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll);
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    io.observe(el);
    compute();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
              transform: `translate3d(0, ${(1 - eased) * 70}px, 0)`,
              opacity: 0.35 + eased * 0.65,
            } as React.CSSProperties)
      }
    >
      {children}
    </div>
  );
}

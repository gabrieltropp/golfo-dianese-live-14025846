import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card che entra in scena "fluttuante e obliqua" e si raddrizza quando
 * diventa visibile. Anima solo transform/opacity e non si ri-anima più.
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
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rot = index % 2 === 0 ? 5 : -6;

  return (
    <div
      ref={ref}
      className={cn("reveal", shown && "is-in", className)}
      style={
        {
          "--reveal-rot": `${rot}deg`,
          "--reveal-delay": `${(index % 4) * 70}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

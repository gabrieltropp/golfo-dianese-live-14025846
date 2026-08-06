import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTurnstileSiteKey } from "@/lib/turnstile.functions";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void },
  ) => string;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) return new Promise((r) => existing.addEventListener("load", () => r()));
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(s);
  });
}

/** Renders the Cloudflare Turnstile widget and exposes the resulting token. */
export function useTurnstile() {
  const getKey = useServerFn(getTurnstileSiteKey);
  const { data } = useQuery({
    queryKey: ["turnstile-site-key"],
    queryFn: () => getKey(),
    staleTime: Infinity,
  });
  const siteKey = data === undefined ? undefined : (data.siteKey ?? null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetId.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetId.current) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (tk) => setToken(tk),
          "expired-callback": () => setToken(null),
        });
      })
      .catch(() => setToken(null));
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  function reset() {
    setToken(null);
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }

  return { siteKey, token, containerRef, reset };
}

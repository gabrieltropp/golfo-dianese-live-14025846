import { createServerFn } from "@tanstack/react-start";

/** Public site key for the login captcha, or null when Turnstile is not configured. */
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(async () => ({
  siteKey: process.env["TURNSTILE_SITE_KEY"] ?? null,
}));

/** Server-side verification of a Turnstile token: the client check alone is not trusted. */
export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const secret = process.env["TURNSTILE_SECRET_KEY"];
    if (!secret) return { ok: false, reason: "not_configured" as const };
    const token = (data?.token ?? "").slice(0, 4096);
    if (!token) return { ok: false, reason: "missing_token" as const };

    try {
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
      });
      const json = (await res.json()) as { success?: boolean };
      return json.success === true
        ? { ok: true as const, reason: null }
        : { ok: false as const, reason: "rejected" as const };
    } catch {
      return { ok: false as const, reason: "network" as const };
    }
  });

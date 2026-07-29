import { createFileRoute } from "@tanstack/react-router";

async function run() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { scrapeBalneazione } = await import("@/lib/scrape.server");

  const now = new Date().toISOString();
  const anno = new Date().getUTCFullYear();

  try {
    const results = await scrapeBalneazione(anno, now);
    const { error: pErr } = await supabaseAdmin
      .from("punti_balneazione")
      .upsert(
        results.map((r) => r.punto),
        { onConflict: "codice_acqua" },
      );
    if (pErr) throw new Error(pErr.message);
    const { error: sErr } = await supabaseAdmin
      .from("balneazione_stato")
      .upsert(
        results.map((r) => r.stato),
        { onConflict: "codice_acqua" },
      );
    if (sErr) throw new Error(sErr.message);

    await supabaseAdmin.from("fonti_stato").upsert(
      {
        fonte: "ARPAL Balneazione",
        ok: true,
        error: null,
        items: results.length,
        last_success_at: now,
        fetched_at: now,
      },
      { onConflict: "fonte" },
    );
    return Response.json({ ok: true, at: now, anno, points: results.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[refresh-balneazione]", message);
    const { data: prev } = await supabaseAdmin
      .from("fonti_stato")
      .select("last_success_at")
      .eq("fonte", "ARPAL Balneazione")
      .maybeSingle();
    await supabaseAdmin.from("fonti_stato").upsert(
      {
        fonte: "ARPAL Balneazione",
        ok: false,
        error: message.slice(0, 500),
        items: 0,
        last_success_at: prev?.last_success_at ?? null,
        fetched_at: now,
      },
      { onConflict: "fonte" },
    );
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}

export const Route = createFileRoute("/api/public/hooks/refresh-balneazione")({
  server: {
    handlers: {
      GET: async () => run(),
      POST: async () => run(),
    },
  },
});
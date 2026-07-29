import { createFileRoute } from "@tanstack/react-router";

async function run() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const {
    scrapeDianoMarina,
    scrapeSanBartolomeo,
    scrapeCervo,
    scrapeRivieracqua,
    type AvvisoRow,
  } = await import("@/lib/scrape.server");

  const now = new Date().toISOString();
  const sources: Array<{ fonte: string; fn: () => Promise<AvvisoRow[]> }> = [
    { fonte: "Comune di Diano Marina", fn: () => scrapeDianoMarina(now) },
    { fonte: "Comune di San Bartolomeo al Mare", fn: () => scrapeSanBartolomeo(now) },
    { fonte: "Comune di Cervo", fn: () => scrapeCervo(now) },
    { fonte: "Rivieracqua", fn: () => scrapeRivieracqua(now) },
  ];

  const report: Record<string, { ok: boolean; items: number; error?: string }> = {};

  for (const source of sources) {
    try {
      const rows = await source.fn();
      const deduped = Array.from(new Map(rows.map((r) => [r.url, r])).values());
      if (deduped.length > 0) {
        const { error } = await supabaseAdmin
          .from("avvisi")
          .upsert(deduped, { onConflict: "url" });
        if (error) throw new Error(error.message);
      }
      report[source.fonte] = { ok: true, items: deduped.length };
      await supabaseAdmin.from("fonti_stato").upsert(
        {
          fonte: source.fonte,
          ok: true,
          error: null,
          items: deduped.length,
          last_success_at: now,
          fetched_at: now,
        },
        { onConflict: "fonte" },
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[refresh-avvisi] ${source.fonte}:`, message);
      report[source.fonte] = { ok: false, items: 0, error: message };
      const { data: prev } = await supabaseAdmin
        .from("fonti_stato")
        .select("last_success_at")
        .eq("fonte", source.fonte)
        .maybeSingle();
      await supabaseAdmin.from("fonti_stato").upsert(
        {
          fonte: source.fonte,
          ok: false,
          error: message.slice(0, 500),
          items: 0,
          last_success_at: prev?.last_success_at ?? null,
          fetched_at: now,
        },
        { onConflict: "fonte" },
      );
    }
  }

  return Response.json({ ok: true, at: now, report });
}

export const Route = createFileRoute("/api/public/hooks/refresh-avvisi")({
  server: {
    handlers: {
      GET: async () => run(),
      POST: async () => run(),
    },
  },
});
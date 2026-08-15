import { createFileRoute } from "@tanstack/react-router";
import type { AvvisoRow } from "@/lib/scrape.server";

async function run() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { scrapeDianoMarina, scrapeSanBartolomeo, scrapeCervo, scrapeRivieracqua } =
      await import("@/lib/scrape.server");

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
            fail_streak: 0,
          },
          { onConflict: "fonte" },
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`[refresh-avvisi] ${source.fonte}:`, message);
        report[source.fonte] = { ok: false, items: 0, error: message };
        try {
          const { data: prev } = await supabaseAdmin
            .from("fonti_stato")
            .select("last_success_at, fail_streak")
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
              fail_streak: (prev?.fail_streak ?? 0) + 1,
            },
            { onConflict: "fonte" },
          );
        } catch (statusError) {
          // Anche la scrittura dello stato può fallire (es. credenziali Supabase
          // mancanti): non deve mai far cadere l'intera richiesta con un 500 muto.
          console.error("[refresh-avvisi] impossibile scrivere fonti_stato:", statusError);
        }
      }
    }

    // Retention: notices older than one month are removed.
    // Avvolta in try/catch: un errore qui non deve nascondere l'esito reale
    // dello scraping già completato sopra, e non deve mai produrre un 500
    // senza messaggio.
    try {
      const cutoff = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("avvisi").delete().lt("data_pubblicazione", cutoff);
      await supabaseAdmin
        .from("avvisi")
        .delete()
        .is("data_pubblicazione", null)
        .lt("fetched_at", cutoff);
    } catch (cleanupError) {
      console.error("[refresh-avvisi] retention cleanup fallita:", cleanupError);
    }

    const allFailed = Object.values(report).every((r) => !r.ok);
    return Response.json(
      { ok: !allFailed, at: now, report },
      { status: allFailed ? 502 : 200 },
    );
  } catch (e) {
    // Rete negata verso una fonte, credenziali Supabase mancanti, errore di
    // import: qualsiasi cosa finisca qui torna sempre come JSON con un
    // messaggio leggibile, mai un 500 vuoto.
    const message = e instanceof Error ? e.message : String(e);
    console.error("[refresh-avvisi] errore non gestito:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/refresh-avvisi")({
  server: {
    handlers: {
      GET: async () => run(),
      POST: async () => run(),
    },
  },
});

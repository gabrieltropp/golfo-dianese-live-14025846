import { createFileRoute } from "@tanstack/react-router";

async function run() {
  const now = new Date().toISOString();
  const anno = new Date().getUTCFullYear();

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { scrapeBalneazione } = await import("@/lib/scrape.server");

    const results = await scrapeBalneazione(anno, now);

    // Coherence check: a sampling date older than the one already stored for the
    // same point is an anomaly (stale upstream payload) — keep the newer date and
    // surface it in the admin "Stato aggiornamenti" panel.
    const { data: previous } = await supabaseAdmin
      .from("balneazione_stato")
      .select("codice_acqua, data_ultimo_controllo");
    const prevDates = new Map(
      (previous ?? []).map((r) => [r.codice_acqua, r.data_ultimo_controllo as string | null]),
    );
    const anomalie: string[] = [];
    for (const r of results) {
      const old = prevDates.get(r.stato.codice_acqua) ?? null;
      const next = r.stato.data_ultimo_controllo;
      if (old && next && next < old) {
        anomalie.push(`${r.punto.nome_punto}: ${next} < ${old}`);
        r.stato.data_ultimo_controllo = old;
      }
    }

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
        fail_streak: 0,
        anomalia:
          anomalie.length > 0
            ? `Date di campionamento più vecchie del dato salvato: ${anomalie.join("; ")}`.slice(0, 500)
            : null,
      },
      { onConflict: "fonte" },
    );
    return Response.json({ ok: true, at: now, anno, points: results.length, anomalie });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[refresh-balneazione]", message);
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: prev } = await supabaseAdmin
        .from("fonti_stato")
        .select("last_success_at, fail_streak")
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
          fail_streak: (prev?.fail_streak ?? 0) + 1,
        },
        { onConflict: "fonte" },
      );
    } catch (statusError) {
      // Se anche la scrittura dello stato fallisce (es. credenziali Supabase
      // mancanti), non deve mai risultare in un 500 senza messaggio: il
      // messaggio originale viene comunque restituito sotto.
      console.error("[refresh-balneazione] impossibile scrivere fonti_stato:", statusError);
    }
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

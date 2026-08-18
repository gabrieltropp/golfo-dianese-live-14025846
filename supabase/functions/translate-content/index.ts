// Edge Function (Deno) — sostituisce translateContent/translateTexts di
// src/lib/translations.server.ts, che girava lato Cloudflare Worker ed era
// esposta allo stesso bug "markAsUncloneable" già visto per lo scraping:
// falliva in silenzio (try/catch che ritorna il testo originale), quindi il
// contenuto dinamico restava sempre in italiano senza nessun errore visibile.
import { createClient } from "npm:@supabase/supabase-js@2";

const LANG_NAMES: Record<string, string> = {
  it: "Italian",
  en: "English",
  fr: "French",
  de: "German",
};

type ContentItem = { id: string; campo: string; testo: string };

const MAX_ITEMS = 60;
const MAX_CHARS = 1500;

function keyOf(id: string, campo: string): string {
  return `${id}::${campo}`;
}

async function sourceHash(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text.trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function translateBatch(texts: string[], lang: string): Promise<string[]> {
  const target = LANG_NAMES[lang];
  if (!target || lang === "it" || texts.length === 0) return texts;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return texts;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              `Translate each item of the JSON array from Italian into ${target}. ` +
              "Keep proper nouns (towns, streets, organisations) unchanged. " +
              "Reply with ONLY a JSON array of strings, same length and order.",
          },
          { role: "user", content: JSON.stringify(texts) },
        ],
      }),
    });
    if (!res.ok) return texts;
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return texts;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed) || parsed.length !== texts.length) return texts;
    return parsed.map((v: unknown, i: number) => (typeof v === "string" && v.trim() ? v : texts[i]));
  } catch {
    return texts;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { items, lang } = (await req.json()) as { items: ContentItem[]; lang: string };
    const out: Record<string, string> = {};
    const clean = (items ?? [])
      .filter((i) => i && typeof i.testo === "string" && i.testo.trim().length > 0)
      .slice(0, MAX_ITEMS)
      .map((i) => ({
        id: String(i.id).slice(0, 200),
        campo: String(i.campo).slice(0, 60),
        testo: i.testo.slice(0, MAX_CHARS),
      }));

    if (clean.length === 0 || lang === "it" || !LANG_NAMES[lang]) {
      for (const i of clean) out[keyOf(i.id, i.campo)] = i.testo;
      return new Response(JSON.stringify({ map: out }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const hashes = await Promise.all(clean.map((i) => sourceHash(i.testo)));

    const { data: rows } = await supabaseAdmin
      .from("traduzioni")
      .select("contenuto_id, campo, lingua, hash_sorgente, testo_tradotto")
      .eq("lingua", lang)
      .in("contenuto_id", Array.from(new Set(clean.map((i) => i.id))));

    const stored = new Map((rows ?? []).map((r) => [keyOf(r.contenuto_id, r.campo), r] as const));

    const missing: Array<{ item: ContentItem; hash: string }> = [];
    clean.forEach((item, idx) => {
      const key = keyOf(item.id, item.campo);
      const row = stored.get(key);
      if (row && row.hash_sorgente === hashes[idx]) {
        out[key] = row.testo_tradotto;
      } else {
        out[key] = row?.testo_tradotto ?? item.testo;
        missing.push({ item, hash: hashes[idx] });
      }
    });

    if (missing.length > 0) {
      const translated = await translateBatch(missing.map((m) => m.item.testo), lang);
      const upserts = missing.map((m, i) => ({
        contenuto_id: m.item.id,
        campo: m.item.campo,
        lingua: lang,
        hash_sorgente: m.hash,
        testo_tradotto: translated[i] ?? m.item.testo,
      }));
      missing.forEach((m, i) => {
        out[keyOf(m.item.id, m.item.campo)] = translated[i] ?? m.item.testo;
      });
      await supabaseAdmin.from("traduzioni").upsert(upserts, { onConflict: "contenuto_id,campo,lingua" });
    }

    return new Response(JSON.stringify({ map: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ map: {}, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

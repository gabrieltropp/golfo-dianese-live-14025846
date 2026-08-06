/** Server-only translation pipeline for dynamic content (avvisi, segnalazioni). */

export const SUPPORTED_LANGS = ["en", "fr", "de"] as const;

const LANG_NAMES: Record<string, string> = {
  it: "Italian",
  en: "English",
  fr: "French",
  de: "German",
};

export type ContentItem = { id: string; campo: string; testo: string };

export const MAX_ITEMS = 60;
export const MAX_CHARS = 1500;

export function keyOf(id: string, campo: string): string {
  return `${id}::${campo}`;
}

/** Stable fingerprint of the Italian source text. */
export async function sourceHash(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text.trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Calls the AI gateway; returns the original strings on any failure. */
export async function translateBatch(texts: string[], lang: string): Promise<string[]> {
  const target = LANG_NAMES[lang];
  if (!target || lang === "it" || texts.length === 0) return texts;
  const apiKey = process.env["LOVABLE_API_KEY"];
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
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return texts;
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== texts.length) return texts;
    return parsed.map((v, i) => (typeof v === "string" && v.trim() ? v : texts[i]));
  } catch {
    return texts;
  }
}

/**
 * Returns a translation for every item, keeping the `traduzioni` table aligned
 * with the source text: a stored row whose `hash_sorgente` no longer matches the
 * current Italian text is re-translated before being served, never returned stale.
 */
export async function translateContentItems(
  items: ContentItem[],
  lang: string,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const clean = items
    .filter((i) => i && typeof i.testo === "string" && i.testo.trim().length > 0)
    .slice(0, MAX_ITEMS)
    .map((i) => ({
      id: String(i.id).slice(0, 200),
      campo: String(i.campo).slice(0, 60),
      testo: i.testo.slice(0, MAX_CHARS),
    }));
  if (clean.length === 0 || lang === "it" || !LANG_NAMES[lang]) {
    for (const i of clean) out[keyOf(i.id, i.campo)] = i.testo;
    return out;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const hashes = await Promise.all(clean.map((i) => sourceHash(i.testo)));

  const { data: rows } = await supabaseAdmin
    .from("traduzioni")
    .select("contenuto_id, campo, lingua, hash_sorgente, testo_tradotto")
    .eq("lingua", lang)
    .in("contenuto_id", Array.from(new Set(clean.map((i) => i.id))));

  const stored = new Map(
    (rows ?? []).map((r) => [keyOf(r.contenuto_id, r.campo), r] as const),
  );

  const missing: Array<{ item: ContentItem; hash: string }> = [];
  clean.forEach((item, idx) => {
    const key = keyOf(item.id, item.campo);
    const row = stored.get(key);
    if (row && row.hash_sorgente === hashes[idx]) {
      out[key] = row.testo_tradotto;
    } else {
      // Show the last known translation (or Italian) while a fresh one is computed.
      out[key] = row?.testo_tradotto ?? item.testo;
      missing.push({ item, hash: hashes[idx] });
    }
  });

  if (missing.length > 0) {
    const translated = await translateBatch(
      missing.map((m) => m.item.testo),
      lang,
    );
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
    await supabaseAdmin
      .from("traduzioni")
      .upsert(upserts, { onConflict: "contenuto_id,campo,lingua" });
  }

  return out;
}

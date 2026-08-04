import { createFileRoute } from "@tanstack/react-router";

const COMUNI = ["Diano Marina", "San Bartolomeo al Mare", "Cervo"];
const CATEGORIE = ["viabilita", "acqua", "eventi", "sicurezza", "altro"];
const MAX_TEXT = 500;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const RATE_LIMIT = 5;

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

async function hashIp(ip: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`gdl:${ip}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function handle(request: Request) {
  const form = await request.formData();

  // Honeypot: real users never fill this hidden field.
  if (String(form.get("website") ?? "").trim() !== "") {
    return Response.json({ ok: true });
  }

  const comune = String(form.get("comune") ?? "").trim();
  const testo = String(form.get("testo") ?? "").trim();
  const categoriaRaw = String(form.get("categoria") ?? "").trim();
  const contatto = String(form.get("contatto") ?? "").trim();

  if (!COMUNI.includes(comune)) return bad("comune_invalid");
  if (testo.length < 10 || testo.length > MAX_TEXT) return bad("testo_invalid");
  if (categoriaRaw && !CATEGORIE.includes(categoriaRaw)) return bad("categoria_invalid");
  if (contatto && (contatto.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contatto)))
    return bad("contatto_invalid");

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ip_hash = await hashIp(ip);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("segnalazioni")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("data_invio", since);
  if ((count ?? 0) >= RATE_LIMIT) return bad("rate_limited", 429);

  let foto_url: string | null = null;
  const photo = form.get("foto");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return bad("foto_too_large");
    if (!photo.type.startsWith("image/")) return bad("foto_invalid");
    const ext = photo.type.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const up = await supabaseAdmin.storage
      .from("segnalazioni")
      .upload(path, await photo.arrayBuffer(), { contentType: photo.type });
    if (!up.error) {
      const signed = await supabaseAdmin.storage
        .from("segnalazioni")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      foto_url = signed.data?.signedUrl ?? null;
    }
  }

  // Never auto-published: every report enters the moderation queue.
  const { error } = await supabaseAdmin.from("segnalazioni").insert({
    comune,
    testo,
    categoria: categoriaRaw || null,
    contatto: contatto || null,
    foto_url,
    ip_hash,
    stato: "in_attesa",
  });
  if (error) return bad("insert_failed", 500);

  return Response.json({ ok: true });
}

export const Route = createFileRoute("/api/public/segnala")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
    },
  },
});
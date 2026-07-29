import * as cheerio from "cheerio";

export type AvvisoRow = {
  fonte: string;
  comune: string;
  titolo: string;
  testo_breve: string | null;
  url: string;
  data_pubblicazione: string | null;
  categoria: string | null;
  fetched_at: string;
};

const UA =
  "Mozilla/5.0 (compatible; GolfoDianeseLive/1.0; +https://golfo-dianese-live.lovable.app)";

async function getText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return await res.text();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

function clean(s: string | undefined | null): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(s: string): string {
  return clean(cheerio.load(`<div>${s}</div>`)("div").text());
}

const MESI: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};

/** Parses Italian dates such as "29 Aprile 2026". Returns ISO date or null. */
export function parseItalianDate(raw: string): string | null {
  const m = clean(raw)
    .toLowerCase()
    .match(/(\d{1,2})\s+([a-zàèéìòù]+)\.?\s+(\d{4})/);
  if (!m) return null;
  const monthKey = Object.keys(MESI).find((k) => k.startsWith(m[2].slice(0, 3)));
  if (!monthKey) return null;
  const d = new Date(Date.UTC(Number(m[3]), MESI[monthKey] - 1, Number(m[1])));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Comune di Diano Marina — Drupal "Design Comuni" news list. */
export async function scrapeDianoMarina(now: string): Promise<AvvisoRow[]> {
  const base = "https://www.comune.dianomarina.im.it";
  const rows: AvvisoRow[] = [];
  for (const path of ["/novita/news", "/novita/avvisi"]) {
    let html: string;
    try {
      html = await getText(base + path);
    } catch {
      continue;
    }
    const $ = cheerio.load(html);
    $("div.card").each((_, el) => {
      const card = $(el);
      const link = card.find("h4.card-title a, h3.card-title a").first();
      const href = link.attr("href");
      const titolo = clean(link.text());
      if (!href || !titolo) return;
      const url = href.startsWith("http") ? href : base + href;
      rows.push({
        fonte: "Comune di Diano Marina",
        comune: "Diano Marina",
        titolo,
        testo_breve: clean(card.find(".card-body > p").not(".time-created-news-list").not(".tag-categorie").first().text()) || null,
        url,
        data_pubblicazione: parseItalianDate(card.find(".time-created-news-list").text()),
        categoria: path.includes("avvisi") ? "Avviso" : "Notizia",
        fetched_at: now,
      });
    });
  }
  if (rows.length === 0) throw new Error("Diano Marina: nessun elemento trovato (markup cambiato?)");
  return rows;
}

type WpPost = {
  link: string;
  date_gmt: string;
  title: { rendered: string };
  excerpt?: { rendered: string };
  content?: { rendered: string };
};

/** Comune di San Bartolomeo al Mare — WordPress REST API. */
export async function scrapeSanBartolomeo(now: string): Promise<AvvisoRow[]> {
  const posts = await getJson<WpPost[]>(
    "https://www.comune.sanbartolomeoalmare.im.it/wp-json/wp/v2/posts?per_page=20&_fields=link,date_gmt,title,excerpt",
  );
  if (!Array.isArray(posts)) throw new Error("San Bartolomeo: risposta inattesa");
  return posts.map((p) => ({
    fonte: "Comune di San Bartolomeo al Mare",
    comune: "San Bartolomeo al Mare",
    titolo: stripHtml(p.title.rendered),
    testo_breve: stripHtml(p.excerpt?.rendered ?? "").slice(0, 400) || null,
    url: p.link,
    data_pubblicazione: p.date_gmt ? new Date(p.date_gmt + "Z").toISOString() : null,
    categoria: "Notizia",
    fetched_at: now,
  }));
}

/** Comune di Cervo — legacy CMS, news list at /home/novita.html. */
export async function scrapeCervo(now: string): Promise<AvvisoRow[]> {
  const base = "https://www.comune.cervo.im.it";
  const html = await getText(base + "/home/novita.html");
  const $ = cheerio.load(html);
  const rows: AvvisoRow[] = [];
  const seen = new Set<string>();
  $("h3 a[href^='/notizie/'], h2 a[href^='/notizie/']").each((_, el) => {
    const a = $(el);
    const href = a.attr("href");
    const titolo = clean(a.text());
    if (!href || !titolo) return;
    const url = base + href;
    if (seen.has(url)) return;
    seen.add(url);
    const card = a.closest(".card-body");
    rows.push({
      fonte: "Comune di Cervo",
      comune: "Cervo",
      titolo,
      testo_breve: clean(card.find("p.card-text").first().text()) || null,
      url,
      data_pubblicazione: parseItalianDate(card.find("span.data").first().text()),
      categoria: clean(card.find(".category-top span").first().text()) || "Notizia",
      fetched_at: now,
    });
  });
  if (rows.length === 0) throw new Error("Cervo: nessun elemento trovato (markup cambiato?)");
  return rows;
}

const RIVIERACQUA_COMUNI: Array<{ comune: string; patterns: RegExp[] }> = [
  { comune: "Diano Marina", patterns: [/diano\s+marina/i] },
  { comune: "San Bartolomeo al Mare", patterns: [/s(an|\.)\s*bartolomeo/i] },
  { comune: "Cervo", patterns: [/\bcervo\b/i] },
];

/** Rivieracqua — WordPress REST API, category "avvisi", filtered by town names in the body. */
export async function scrapeRivieracqua(now: string): Promise<AvvisoRow[]> {
  const cats = await getJson<Array<{ id: number; slug: string }>>(
    "https://rivieracqua.it/wp-json/wp/v2/categories?search=avvisi",
  );
  const cat = cats.find((c) => c.slug === "avvisi");
  if (!cat) throw new Error("Rivieracqua: categoria 'avvisi' non trovata");
  const posts = await getJson<WpPost[]>(
    `https://rivieracqua.it/wp-json/wp/v2/posts?categories=${cat.id}&per_page=30&_fields=link,date_gmt,title,excerpt,content`,
  );
  const rows: AvvisoRow[] = [];
  for (const p of posts) {
    const titolo = stripHtml(p.title.rendered);
    const body = stripHtml(p.content?.rendered ?? "");
    const haystack = `${titolo} ${body}`;
    for (const { comune, patterns } of RIVIERACQUA_COMUNI) {
      if (!patterns.some((re) => re.test(haystack))) continue;
      rows.push({
        fonte: "Rivieracqua",
        comune,
        titolo,
        testo_breve: (stripHtml(p.excerpt?.rendered ?? "") || body).slice(0, 400) || null,
        // one article can cover several towns: keep the URL unique per town
        url: `${p.link}#${comune.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        data_pubblicazione: p.date_gmt ? new Date(p.date_gmt + "Z").toISOString() : null,
        categoria: "Servizio idrico",
        fetched_at: now,
      });
    }
  }
  return rows;
}

/* ------------------------------ ARPAL balneazione ------------------------------ */

const ARPAL_API = "https://aws.arpal.liguria.it/siapi/Service/Query";

/** ARPAL comune label -> label used in the app. */
export const ARPAL_COMUNI: Array<{ arpal: string; comune: string; ordine: number }> = [
  { arpal: "Diano Marina", comune: "Diano Marina", ordine: 100 },
  { arpal: "S.Bartolomeo Al Mare", comune: "San Bartolomeo al Mare", ordine: 200 },
  { arpal: "Cervo", comune: "Cervo", ordine: 300 },
];

type ArpalPoint = {
  ANNO: number;
  COMUNE: string;
  CODICE_ACQUA: string;
  DESCRIZIONE_ACQUA: string;
  CLASSIFICAZIONE: string | null;
  STATO: string | null;
  STATO_MOTIVO: string | null;
  STATO_DATA: string | null;
};

export type BalneazioneScrape = {
  punto: { codice_acqua: string; comune: string; nome_punto: string; ordine_costa: number };
  stato: {
    codice_acqua: string;
    stato: "compliant" | "non_compliant" | "unknown";
    stato_raw: string | null;
    classificazione: string | null;
    motivo: string | null;
    anno: number;
    data_ultimo_controllo: string | null;
    source_url: string;
    fetched_at: string;
  };
};

function mapStato(raw: string | null): "compliant" | "non_compliant" | "unknown" {
  const s = (raw ?? "").toUpperCase();
  if (s.includes("NON")) return "non_compliant";
  if (s.includes("CONFORME")) return "compliant";
  if (s.includes("DIVIET")) return "non_compliant";
  return "unknown";
}

export async function scrapeBalneazione(anno: number, now: string): Promise<BalneazioneScrape[]> {
  const out: BalneazioneScrape[] = [];
  for (const { arpal, comune, ordine } of ARPAL_COMUNI) {
    const points = await getJson<ArpalPoint[]>(
      `${ARPAL_API}/BalneazioneRete?ANNO=${anno}&PROVINCIA=Imperia&COMUNE=${encodeURIComponent(arpal)}`,
    );
    const sorted = [...points].sort((a, b) =>
      a.DESCRIZIONE_ACQUA.localeCompare(b.DESCRIZIONE_ACQUA, "it"),
    );
    sorted.forEach((p, i) => {
      out.push({
        punto: {
          codice_acqua: p.CODICE_ACQUA,
          comune,
          nome_punto: clean(p.DESCRIZIONE_ACQUA),
          ordine_costa: ordine + i,
        },
        stato: {
          codice_acqua: p.CODICE_ACQUA,
          stato: mapStato(p.STATO),
          stato_raw: clean(p.STATO) || null,
          classificazione: clean(p.CLASSIFICAZIONE) || null,
          motivo: clean(p.STATO_MOTIVO).replace(/^-$/, "") || null,
          anno,
          data_ultimo_controllo: p.STATO_DATA ? p.STATO_DATA.slice(0, 10) : null,
          source_url: `https://www.arpal.liguria.it/tematiche/mare/balneabilita.html?ANNO=${anno}&CODICE_ACQUA=${p.CODICE_ACQUA}&PROVINCIA=Imperia&COMUNE=${encodeURIComponent(arpal)}`,
          fetched_at: now,
        },
      });
    });
  }
  if (out.length === 0) throw new Error("ARPAL: nessun punto di monitoraggio restituito");
  return out;
}
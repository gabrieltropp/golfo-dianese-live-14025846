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
  comuni_citati?: string[];
  data_intervento?: string | null;
  /** True when the publication date could not be determined with certainty. */
  necessita_revisione?: boolean;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const HTML_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
};

async function getText(url: string): Promise<string> {
  const res = await fetch(url, { headers: HTML_HEADERS });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return await res.text();
}

async function getJson<T>(url: string): Promise<T> {
  // Always hit the origin: no CDN/runtime cache may serve a stale ARPAL payload.
  const bust = `${url.includes("?") ? "&" : "?"}_ts=${Date.now()}`;
  const res = await fetch(url + bust, {
    cache: "no-store",
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
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

/** Reads the authoritative publication date from a WordPress/schema.org page. */
export function extractPublishedTime(html: string): string | null {
  const m =
    html.match(/property=["']article:published_time["']\s+content=["']([^"']+)["']/i) ??
    html.match(/content=["']([^"']+)["']\s+property=["']article:published_time["']/i) ??
    html.match(/"datePublished"\s*:\s*"([^"]+)"/) ??
    html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
  if (!m) return null;
  const d = new Date(m[1]);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Parses Italian dates such as "29 Aprile 2026", "30 lug 2026", "09.07.26". Returns ISO or null. */
export function parseItalianDate(raw: string): string | null {
  const text = clean(raw).toLowerCase();
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const numeric = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})/);
  if (numeric) {
    const year = numeric[3].length === 2 ? 2000 + Number(numeric[3]) : Number(numeric[3]);
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const m = text.match(/(\d{1,2})\s*°?\s+([a-zàèéìòù]{3,})\.?\s+(\d{2,4})/);
  if (!m) return null;
  const monthKey = Object.keys(MESI).find((k) => k.startsWith(m[2].slice(0, 3)));
  if (!monthKey) return null;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const day = Number(m[1]);
  if (day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, MESI[monthKey] - 1, day));
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
      const data = parseItalianDate(card.find(".time-created-news-list").text());
      rows.push({
        fonte: "Comune di Diano Marina",
        comune: "Diano Marina",
        titolo,
        testo_breve: clean(card.find(".card-body > p").not(".time-created-news-list").not(".tag-categorie").first().text()) || null,
        url,
        data_pubblicazione: data,
        necessita_revisione: data === null,
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

/** Comune di San Bartolomeo al Mare — news list at /novita/. */
export async function scrapeSanBartolomeo(now: string): Promise<AvvisoRow[]> {
  const html = await getText("https://www.comune.sanbartolomeoalmare.im.it/novita/");
  const $ = cheerio.load(html);
  const rows: AvvisoRow[] = [];
  const seen = new Set<string>();
  $("div.card-body").each((_, el) => {
    const card = $(el);
    const link = card.find("a h3.card-title").first().parent();
    const href = link.attr("href");
    const titolo = clean(card.find("h3.card-title").first().text());
    if (!href || !titolo || !href.includes("/novita/")) return;
    if (seen.has(href)) return;
    seen.add(href);
    const data = parseItalianDate(card.find("span.data").first().text());
    rows.push({
      fonte: "Comune di San Bartolomeo al Mare",
      comune: "San Bartolomeo al Mare",
      titolo,
      testo_breve: clean(card.find("p.card-text").first().text()) || null,
      url: href,
      data_pubblicazione: data,
      necessita_revisione: data === null,
      categoria: clean(card.find("a.category").first().text()) || "Notizia",
      fetched_at: now,
    });
  });
  if (rows.length === 0)
    throw new Error("San Bartolomeo: nessun elemento trovato (markup cambiato?)");
  return rows;
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
    const data = parseItalianDate(card.find("span.data").first().text());
    rows.push({
      fonte: "Comune di Cervo",
      comune: "Cervo",
      titolo,
      testo_breve: clean(card.find("p.card-text").first().text()) || null,
      url,
      data_pubblicazione: data,
      necessita_revisione: data === null,
      categoria: clean(card.find(".category-top span").first().text()) || "Notizia",
      fetched_at: now,
    });
  });
  if (rows.length === 0) throw new Error("Cervo: nessun elemento trovato (markup cambiato?)");
  return rows;
}

/** Comuni recognised inside Rivieracqua notices (whole province, not only the gulf). */
const COMUNI_PATTERNS: Array<{ comune: string; pattern: RegExp }> = [
  { comune: "Diano Marina", pattern: /diano\s+marina/i },
  { comune: "Diano Castello", pattern: /diano\s+castello/i },
  { comune: "Diano San Pietro", pattern: /diano\s+s(an|\.)\s*pietro/i },
  { comune: "Diano Arentino", pattern: /diano\s+arentino/i },
  { comune: "San Bartolomeo al Mare", pattern: /s(an|\.)\s*bartolomeo(\s+al\s+mare)?/i },
  { comune: "Cervo", pattern: /\bcervo\b/i },
  { comune: "Imperia", pattern: /\bimperia\b/i },
  { comune: "Sanremo", pattern: /\bsan\s?remo\b/i },
  { comune: "Taggia", pattern: /\btaggia\b/i },
  { comune: "Arma di Taggia", pattern: /arma\s+di\s+taggia/i },
  { comune: "Ventimiglia", pattern: /\bventimiglia\b/i },
  { comune: "Bordighera", pattern: /\bbordighera\b/i },
  { comune: "Ospedaletti", pattern: /\bospedaletti\b/i },
  { comune: "Riva Ligure", pattern: /riva\s+ligure/i },
  { comune: "Santo Stefano al Mare", pattern: /s(anto|\.)\s*stefano\s+al\s+mare/i },
  { comune: "Cipressa", pattern: /\bcipressa\b/i },
  { comune: "Costarainera", pattern: /\bcostarainera\b/i },
  { comune: "San Lorenzo al Mare", pattern: /s(an|\.)\s*lorenzo\s+al\s+mare/i },
  { comune: "Civezza", pattern: /\bcivezza\b/i },
  { comune: "Pietrabruna", pattern: /\bpietrabruna\b/i },
  { comune: "Dolcedo", pattern: /\bdolcedo\b/i },
  { comune: "Pontedassio", pattern: /\bpontedassio\b/i },
  { comune: "Chiusanico", pattern: /\bchiusanico\b/i },
  { comune: "Villa Faraldi", pattern: /villa\s+faraldi/i },
  { comune: "Andora", pattern: /\bandora\b/i },
  { comune: "Cesio", pattern: /\bcesio\b/i },
  { comune: "Borgomaro", pattern: /\bborgomaro\b/i },
];

export function extractComuniCitati(text: string): string[] {
  return COMUNI_PATTERNS.filter(({ pattern }) => pattern.test(text)).map((c) => c.comune);
}

/** Pulls an "intervento" date/time hint from the notice body, when present. */
export function extractDataIntervento(text: string): string | null {
  const m =
    text.match(/data\s+(?:e\s+ora\s+)?(?:dell'?\s*)?intervento\s*[:_*\-–\s]*([^_*.;\n]{4,120})/i) ??
    text.match(/(?:il\s+giorno|nella\s+giornata\s+di)\s+([^_*.;\n]{4,120})/i);
  return m ? clean(m[1]).replace(/^[:_*\s-]+|[:_*\s-]+$/g, "") || null : null;
}

/** Rivieracqua — "Avvisi" archive: every notice is kept, with the towns it mentions. */
export async function scrapeRivieracqua(now: string): Promise<AvvisoRow[]> {
  const html = await getText("https://rivieracqua.it/category/avvisi/");
  const $ = cheerio.load(html);
  const items: Array<{ url: string; titolo: string; excerpt: string }> = [];
  const seen = new Set<string>();
  $("div.post-item").each((_, el) => {
    const card = $(el);
    const href = card.find("a.plain").first().attr("href");
    const titolo = clean(card.find("h5.post-title").first().text());
    if (!href || !titolo || seen.has(href)) return;
    seen.add(href);
    items.push({
      url: href,
      titolo,
      excerpt: clean(card.find(".from_the_blog_excerpt").first().text()),
    });
  });
  if (items.length === 0)
    throw new Error("Rivieracqua: nessun avviso trovato (markup cambiato?)");

  const rows: AvvisoRow[] = [];
  for (const item of items.slice(0, 15)) {
    let body = item.excerpt;
    let published: string | null = null;
    try {
      const page = await getText(item.url);
      published = extractPublishedTime(page);
      const $$ = cheerio.load(page);
      const content = $$(".entry-content").first();
      content.find(".blog-share, .social-icons, script, style, nav").remove();
      body = clean(content.find("p").text()) || clean(content.text()) || body;
    } catch {
      // fall back to the excerpt from the archive page
    }
    const haystack = `${item.titolo} ${body}`;
    const comuni = extractComuniCitati(haystack);
    // Authoritative order: the article's own published_time, then the date in the title.
    // Never guess from the scrape time — an unknown date stays null.
    const data = published ?? parseItalianDate(item.titolo);
    rows.push({
      fonte: "Rivieracqua",
      comune: comuni[0] ?? "Provincia di Imperia",
      titolo: item.titolo,
      testo_breve: (item.excerpt || body).slice(0, 400) || null,
      url: item.url,
      data_pubblicazione: data,
      necessita_revisione: data === null,
      categoria: "Servizio idrico",
      fetched_at: now,
      comuni_citati: comuni,
      data_intervento: extractDataIntervento(haystack),
    });
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
import { createServerFn } from "@tanstack/react-start";

export type Emergenza = { titolo: string; url: string; fonte: string; data: string | null };

const QUERY =
  '(incendio OR incendi OR "vigili del fuoco" OR canadair OR frana OR alluvione OR evacuazione OR "protezione civile") ("Diano Marina" OR "Diano San Pietro" OR "Diano Castello" OR "Diano Arentino" OR "San Bartolomeo al Mare" OR Cervo OR Imperia) when:5d';

// Post-filtro: il titolo deve citare esplicitamente un comune del Dianese o
// Imperia città (esclude notizie su Andora o sulla sola provincia).
const LOCALE =
  /\bdiano\b|san bartolomeo|\bcervo\b|\bimperia\b/i;

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export const getEmergenze = createServerFn({ method: "GET" }).handler(async () => {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=it&gl=IT&ceid=IT:it`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 GolfoDianeseLive" } });
  if (!res.ok) throw new Error("emergenze fetch failed");
  const xml = await res.text();
  const items: Emergenza[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const get = (tag: string) => b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1];
    const fonte = decode(get("source") ?? "");
    let titolo = decode(get("title") ?? "");
    if (fonte && titolo.endsWith(` - ${fonte}`)) titolo = titolo.slice(0, -fonte.length - 3);
    const pub = get("pubDate");
    const d = pub ? new Date(pub) : null;
    items.push({
      titolo,
      url: decode(get("link") ?? ""),
      fonte,
      data: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null,
    });
  }
  const filtrati = items.filter((n) => LOCALE.test(n.titolo));
  filtrati.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  return { items: filtrati.slice(0, 8), fetchedAt: new Date().toISOString() };
});

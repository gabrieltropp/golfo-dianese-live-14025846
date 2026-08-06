import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts, translateContent } from "@/lib/translate.functions";
import { useI18n } from "@/lib/i18n";

/**
 * Auto-translates scraped Italian texts into the active UI language.
 * Falls back to the original strings while loading or on failure.
 */
export function useAutoTranslate(texts: string[]): (source: string) => string {
  const { lang } = useI18n();
  const run = useServerFn(translateTexts);
  const unique = Array.from(new Set(texts.filter(Boolean)));

  const { data } = useQuery({
    queryKey: ["auto-translate", lang, unique],
    enabled: lang !== "it" && unique.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const res = await run({ data: { texts: unique, lang } });
      const map: Record<string, string> = {};
      unique.forEach((src, i) => {
        map[src] = res.texts[i] ?? src;
      });
      return map;
    },
  });

  return (source: string) => (lang === "it" ? source : (data?.[source] ?? source));
}

export type TranslatableItem = { id: string; campo: string; testo: string };

/**
 * Translation for dynamic records (avvisi, segnalazioni), cached server-side and
 * keyed by a hash of the Italian source: when the source text changes the
 * translation is regenerated, so it never drifts out of sync with the content.
 */
export function useContentTranslate(
  items: TranslatableItem[],
): (id: string, campo: string, fallback: string) => string {
  const { lang } = useI18n();
  const run = useServerFn(translateContent);
  const payload = items.filter((i) => i.testo && i.testo.trim().length > 0);

  const { data } = useQuery({
    queryKey: ["content-translate", lang, payload.map((i) => `${i.id}:${i.campo}:${i.testo}`)],
    enabled: lang !== "it" && payload.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => (await run({ data: { items: payload, lang } })).map,
  });

  return (id, campo, fallback) =>
    lang === "it" ? fallback : (data?.[`${id}::${campo}`] ?? fallback);
}

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";
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

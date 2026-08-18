import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export type TranslatableItem = { id: string; campo: string; testo: string };

/**
 * Translation for dynamic records (avvisi, segnalazioni), cached server-side and
 * keyed by a hash of the Italian source: when the source text changes the
 * translation is regenerated, so it never drifts out of sync with the content.
 *
 * Chiama una Edge Function Supabase (Deno) invece del server function
 * Cloudflare originario: quest'ultimo era esposto allo stesso bug
 * "markAsUncloneable" già visto per lo scraping e falliva in silenzio,
 * lasciando sempre il testo italiano al posto della traduzione.
 */
export function useContentTranslate(
  items: TranslatableItem[],
): (id: string, campo: string, fallback: string) => string {
  const { lang } = useI18n();
  const payload = items.filter((i) => i.testo && i.testo.trim().length > 0);

  const { data } = useQuery({
    queryKey: ["content-translate", lang, payload.map((i) => `${i.id}:${i.campo}:${i.testo}`)],
    enabled: lang !== "it" && payload.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { items: payload, lang },
      });
      if (error) throw error;
      return (data?.map ?? {}) as Record<string, string>;
    },
  });

  return (id, campo, fallback) =>
    lang === "it" ? fallback : (data?.[`${id}::${campo}`] ?? fallback);
}

import { createServerFn } from "@tanstack/react-start";

type Input = { texts: string[]; lang: string };

const LANG_NAMES: Record<string, string> = {
  it: "Italian",
  en: "English",
  fr: "French",
  de: "German",
};

/** Translates short civic-notice snippets (scraped in Italian) into the UI language. */
export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((data: Input) => data)
  .handler(async ({ data }) => {
    const target = LANG_NAMES[data.lang];
    const texts = (data.texts ?? []).filter((t) => typeof t === "string");
    if (!target || data.lang === "it" || texts.length === 0) return { texts };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { texts };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
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
      if (!res.ok) return { texts };
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = json.choices?.[0]?.message?.content ?? "";
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return { texts };
      const parsed = JSON.parse(match[0]) as unknown;
      if (!Array.isArray(parsed) || parsed.length !== texts.length) return { texts };
      return { texts: parsed.map((v, i) => (typeof v === "string" && v.trim() ? v : texts[i])) };
    } catch {
      return { texts };
    }
  });

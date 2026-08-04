import { LANGUAGES, LANGUAGE_LABELS, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-full bg-primary-foreground/15 p-1">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-bold transition-colors",
            lang === l
              ? "bg-primary-foreground/25 text-white"
              : "text-primary-foreground/80 hover:text-primary-foreground",
          )}
        >
          {LANGUAGE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
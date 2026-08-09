import { LANGUAGES, LANGUAGE_LABELS, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-full bg-header-fg/15 p-1">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-bold transition-colors",
            lang === l
              ? "bg-header-fg/25 text-header-fg"
              : "text-header-fg/70 hover:text-header-fg",
          )}
        >
          {LANGUAGE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
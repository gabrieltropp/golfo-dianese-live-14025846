import { useI18n } from "@/lib/i18n";

type Period = "morning" | "afternoon" | "evening" | "night";

function periodNow(): Period {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "night";
}

export function WelcomeMessage() {
  const { t } = useI18n();
  const period = periodNow();
  const text = t(`welcome.${period}`);
  const letters = Array.from(text);

  return (
    <div className="flex w-full justify-center px-4 py-3">
      <h2
        aria-label={text}
        className="font-display max-w-full text-center text-[clamp(1.5rem,5vw,2.75rem)] leading-tight text-header-fg"
      >
        {letters.map((ch, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="welcome-letter"
            style={
              {
                "--in-delay": `${i * 35}ms`,
                "--float-delay": `${(i % 10) * 140}ms`,
              } as React.CSSProperties
            }
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </h2>
    </div>
  );
}

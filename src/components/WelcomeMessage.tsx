import { useI18n } from "@/lib/i18n";

type Period = "morning" | "afternoon" | "evening" | "night";

function periodNow(): Period {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "night";
}

function AnimatedWord({ word, startDelay }: { word: string; startDelay: number }) {
  const letters = Array.from(word);
  return (
    <span className="inline-block whitespace-nowrap">
      {letters.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="welcome-letter"
          style={
            {
              "--in-delay": `${startDelay + i * 35}ms`,
              "--float-delay": `${(i % 10) * 140}ms`,
            } as React.CSSProperties
          }
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

export function WelcomeMessage() {
  const { t } = useI18n();
  const period = periodNow();
  const text = t(`welcome.${period}`);

  // "Golfo" va sempre a capo su schermi stretti: lo trattiamo come parola a
  // sé, separata dal resto del saluto, invece di lasciare che l'a-capo
  // cada a caso in mezzo al testo.
  const lastSpace = text.lastIndexOf(" ");
  const firstPart = lastSpace >= 0 ? text.slice(0, lastSpace) : text;
  const lastWord = lastSpace >= 0 ? text.slice(lastSpace + 1) : "";

  return (
    <div className="mx-auto mt-6 w-full max-w-4xl px-4 sm:mt-10">
      <div className="glass-soft rounded-3xl px-6 py-6 text-left sm:px-10 sm:py-8">
        <h2
          aria-label={text}
          className="font-display w-full text-[clamp(2rem,11vw,4.5rem)] leading-[1.05] text-header-fg"
        >
          <AnimatedWord word={firstPart} startDelay={0} />
          {lastWord ? (
            <>
              {" "}
              <br className="sm:hidden" />
              <AnimatedWord word={lastWord} startDelay={firstPart.length * 35} />
            </>
          ) : null}
        </h2>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WeatherCard } from "@/components/cards/WeatherCard";
import { BathingCard } from "@/components/cards/BathingCard";
import { WaterCard } from "@/components/cards/WaterCard";
import { MobilityCard } from "@/components/cards/MobilityCard";
import { WebcamCard } from "@/components/cards/WebcamCard";
import { ComuniCard } from "@/components/cards/ComuniCard";
import { useI18n } from "@/lib/i18n";
import { ARPAL_URL } from "@/lib/civic-data";
import bgVideo from "@/assets/sunrisediano.mp4.asset.json";

const DESC =
  "Allerta meteo Protezione Civile, balneabilità ARPAL, avvisi acqua potabile e mobilità per Diano Marina e il Golfo Dianese.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Golfo Dianese Live · Servizi in tempo reale a Diano Marina" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Golfo Dianese Live · Servizi in tempo reale a Diano Marina" },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <div
        className="pointer-events-none fixed inset-0 z-0 w-full overflow-hidden bg-sea-deep"
        aria-hidden="true"
        style={{ height: "100dvh" }}
      >
        <video
          src={bgVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full max-w-full object-cover"
        />
        <div className="absolute inset-0 bg-sea-deep/45" />
      </div>
      <div className="relative z-10">
      <header className="px-5 pb-8 pt-6" style={{ backgroundImage: "var(--gradient-sea)" }}>
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex w-full justify-end sm:hidden">
              <LanguageSwitcher />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sand/15 sm:size-12">
                <img
                  src="/icons/icon-512.png"
                  alt="Golfo Dianese Live"
                  className="size-full object-cover"
                  width={48}
                  height={48}
                />
              </span>
              <div className="min-w-0">
                <h1 className="font-display whitespace-nowrap text-[clamp(1.45rem,6.8vw,2.9rem)] font-extrabold leading-tight text-sand">
                  {t("app.title")}
                </h1>
                <p className="truncate text-sm text-sand/85">{t("app.subtitle")}</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-4xl px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <WeatherCard />
          <BathingCard />
          <WebcamCard />
          <WaterCard />
          <MobilityCard />
          <ComuniCard />
        </div>
      </main>

      <footer className="glass mt-4 border-x-0 border-b-0 px-5 py-8">
        <div className="mx-auto max-w-4xl text-sm text-muted-foreground">
          <p className="mb-3">{t("footer.disclaimer")}</p>
          <p className="mb-2 font-semibold text-foreground">{t("footer.sources")}</p>
          <ul className="mb-4 grid gap-1">
            <li>
              <a className="underline" href="https://allertaliguria.regione.liguria.it/" target="_blank" rel="noreferrer noopener">
                Allerta Liguria · Protezione Civile
              </a>
            </li>
            <li>
              <a className="underline" href={ARPAL_URL} target="_blank" rel="noreferrer noopener">
                ARPAL · Balneabilità
              </a>
            </li>
            <li>
              <a className="underline" href="https://www.rivieracqua.it/" target="_blank" rel="noreferrer noopener">
                Rivieracqua · Servizio idrico
              </a>
            </li>
          </ul>
          <Link to="/admin" className="inline-flex items-center gap-2 underline">
            <Lock className="size-4" /> {t("app.admin")}
          </Link>
        </div>
      </footer>
      </div>
    </div>
  );
}

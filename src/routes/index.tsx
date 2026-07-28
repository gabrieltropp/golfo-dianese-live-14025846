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
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <video
          src={bgVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="size-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-background/10" />
      </div>
      <div className="relative z-10">
      <header className="surface-sea px-5 pb-8 pt-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-primary-foreground/15">
                <img
                  src="/icons/icon-512.png"
                  alt="Golfo Dianese Live"
                  className="size-full object-cover"
                  width={48}
                  height={48}
                />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                  {t("app.title")}
                </h1>
                <p className="text-sm opacity-90">{t("app.subtitle")}</p>
              </div>
            </div>
            <LanguageSwitcher />
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

      <footer className="border-t border-border bg-secondary/60 px-5 py-8">
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

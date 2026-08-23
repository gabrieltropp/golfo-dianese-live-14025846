import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { ShareBanner } from "@/components/ShareBanner";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { supabase } from "@/integrations/supabase/client";
import { WeatherCard } from "@/components/cards/WeatherCard";
import { BathingCard } from "@/components/cards/BathingCard";
import { WaterCard } from "@/components/cards/WaterCard";
import { MobilityCard } from "@/components/cards/MobilityCard";
import { WebcamCard } from "@/components/cards/WebcamCard";
import { ComuniCard } from "@/components/cards/ComuniCard";
import { BachecaCard } from "@/components/cards/BachecaCard";
import { SegnalaForm } from "@/components/SegnalaForm";
import { Reveal } from "@/components/Reveal";
import { useI18n } from "@/lib/i18n";
import { ARPAL_URL } from "@/lib/civic-data";
import { siteConfig } from "@/config/site-config";
import bgVideo from "@/assets/sunrisediano.mp4.asset.json";
import bgPoster from "@/assets/poster-hero.jpg";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [installVisible, setInstallVisible] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Su Safari/iOS l'attributo HTML "muted" a volte non basta da solo:
    // impostarlo anche come proprietà JS, e avviare il play esplicitamente,
    // è il modo più affidabile per evitare che compaia l'icona di play
    // nativa durante il breve istante prima che il video parta.
    el.muted = true;
    const p = el.play();
    if (p) p.catch(() => {});
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!standalone) return;
    // Una volta per sessione, per non gonfiare inutilmente il conteggio:
    // è un indicatore anonimo di utilizzo, non un identificativo personale.
    if (sessionStorage.getItem("standalone-logged")) return;
    sessionStorage.setItem("standalone-logged", "1");
    supabase.from("app_events").insert({ evento: "standalone_launch" }).then();
  }, []);

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <div
        className="pointer-events-none fixed inset-0 z-0 w-full overflow-hidden bg-sea-deep"
        aria-hidden="true"
        style={{ height: "100dvh" }}
      >
        <video
          ref={videoRef}
          src={bgVideo.url}
          poster={bgPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full max-w-full object-cover"
        />
        <div className="absolute inset-0 bg-sea-deep/0" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
      <header
        className="px-5 pb-8 pt-6 text-header-fg"
        style={{ backgroundImage: "var(--gradient-sea)" }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex w-full justify-end sm:hidden">
              <LanguageSwitcher />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-header-fg/15 sm:size-12">
                <img
                  src={siteConfig.loghi.header}
                  alt={siteConfig.loghi.headerAlt}
                  className="size-full object-cover"
                  width={48}
                  height={48}
                />
              </span>
              <div className="min-w-0">
                <h1 className="font-display whitespace-nowrap text-[clamp(1.45rem,6.8vw,2.9rem)] font-extrabold leading-tight text-header-fg">
                  {t("app.title")}
                </h1>
                <p className="truncate text-sm text-header-fg/85">{t("app.subtitle")}</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <WelcomeMessage />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-16 md:pt-24">
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          <Reveal index={0}>
            <WeatherCard />
          </Reveal>
          <Reveal index={1}>
            <BathingCard />
          </Reveal>
          <Reveal index={2}>
            <WebcamCard />
          </Reveal>
          <Reveal index={3}>
            <WaterCard />
          </Reveal>
          <Reveal index={4}>
            <MobilityCard />
          </Reveal>
          <Reveal index={5}>
            <ComuniCard />
          </Reveal>
          <Reveal index={6}>
            <BachecaCard />
          </Reveal>
          <Reveal index={7} className="md:col-span-2">
            <SegnalaForm />
          </Reveal>
        </div>
      </main>

      <footer className="glass mt-8 border-x-0 border-b-0 px-5 py-4">
        <div className="mx-auto max-w-4xl text-sm text-muted-foreground">
          <p className="mb-2 text-xs">{t("footer.disclaimer")}</p>
          <p className="mb-1 font-semibold text-foreground">{t("footer.sources")}</p>
          <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
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
          <p className="mt-4 border-t border-border/40 pt-3 text-xs">
            {t("footer.madeBy")}{" "}
            <a
              className="font-semibold underline"
              href="https://gabrieletropianomultimedia.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              Gabriele Tropiano
            </a>
          </p>
        </div>
      </footer>
      </div>
      <InstallAppBanner onVisibleChange={setInstallVisible} />
      <ShareBanner installBannerVisible={installVisible} />
    </div>
  );
}

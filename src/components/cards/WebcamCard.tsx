import { ExternalLink, Video } from "lucide-react";
import { StatusCard } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";

type Webcam =
  | { nome: string; tipo: "embed"; src: string; pagina: string }
  | { nome: string; tipo: "anteprima"; thumb: string; pagina: string };

/**
 * Solo embed ufficiali: ipcamlive (player pubblico) e Windy public embed
 * player (usato anche da ilMeteo). SkylineWebcams non offre un iframe
 * ufficiale gratuito: mostriamo la sua thumbnail live + link alla pagina.
 */
const WEBCAMS: Webcam[] = [
  {
    nome: "Diano Marina",
    tipo: "embed",
    src: "https://g0.ipcamlive.com/player/player.php?alias=6284b3a9e42ab&skin=white&autoplay=1&disablezoombutton=1&disableframecapture=1&disabletimelapseplayer=1&disabledownloadbutton=1&disableplaybackspeedbutton=1",
    pagina: "https://g0.ipcamlive.com/player/player.php?alias=6284b3a9e42ab",
  },
  {
    nome: "San Bartolomeo al Mare",
    tipo: "embed",
    src: "https://www.windy.com/57bbb963-bbc2-4065-a150-9e4e7609c0d7",
    pagina: "https://www.twitch.tv/hoteldellerose2021",
  },
  {
    nome: "Golfo",
    tipo: "embed",
    thumb: "https://www.windy.com/b92170ef-7292-4a37-9c79-c845d347956d",
    pagina: "https://hoteljasmin.com/webcam/",
  },
];

export function WebcamCard() {
  const { t } = useI18n();

  return (
    <StatusCard
      title={t("card.webcam")}
      icon={<Video />}
      tone="green"
      statusLabel={t("webcam.live")}
      summary={t("webcam.note")}
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {WEBCAMS.map((w) => (
          <li key={w.nome} className="glass-soft overflow-hidden rounded-2xl">
            <div className="overflow-hidden bg-sea-deep">
              {w.tipo === "embed" ? (
                <iframe
                  title={`${t("card.webcam")} · ${w.nome}`}
                  src={w.src}
                  className="aspect-video w-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <img
                  src={w.thumb}
                  alt={`${t("card.webcam")} · ${w.nome}`}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{w.nome}</p>
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-accent">
                  {t("webcam.live")}
                </p>
              </div>
              <a
                href={w.pagina}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                {t("webcam.watch")} <ExternalLink className="size-3" />
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t("webcam.note")}</p>
    </StatusCard>
  );
}
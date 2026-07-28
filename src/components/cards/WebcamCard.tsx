import { Video } from "lucide-react";
import { StatusCard } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";

const WEBCAM_URL =
  "https://g0.ipcamlive.com/player/player.php?alias=6284b3a9e42ab&skin=white&autoplay=1&disablezoombutton=1&disableframecapture=1&disabletimelapseplayer=1&disabledownloadbutton=1&disableplaybackspeedbutton=1";

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
      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        <iframe
          title={t("card.webcam")}
          src={WEBCAM_URL}
          className="aspect-video w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("webcam.note")}</p>
    </StatusCard>
  );
}
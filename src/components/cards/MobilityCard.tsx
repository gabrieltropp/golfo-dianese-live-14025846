import { useQuery } from "@tanstack/react-query";
import { Car, Bike } from "lucide-react";
import { StatusCard, StatusBadge, type StatusTone } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import { fetchBikePath } from "@/lib/civic-data";

export function MobilityCard() {
  const { t, lang } = useI18n();
  const { data } = useQuery({
    queryKey: ["bike-path"],
    queryFn: fetchBikePath,
    staleTime: 5 * 60 * 1000,
  });

  const path = data?.[0];
  const bikeTone: StatusTone =
    path?.status === "closed" ? "red" : path?.status === "works" ? "yellow" : "green";
  const bikeLabel = path ? t(`mobility.bike.${path.status}`) : t("mobility.bike.open");
  const message = path ? (lang === "it" ? path.message_it : (path.message_en ?? path.message_it)) : null;

  return (
    <StatusCard
      title={t("card.mobility")}
      icon={<Car />}
      tone={bikeTone}
      statusLabel={bikeLabel}
      summary={t("mobility.trafficHint")}
    >
      <div className="grid gap-5">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
            <Car className="size-5" /> {t("mobility.traffic")}
          </h3>
          <p className="mb-2 text-sm text-muted-foreground">{t("mobility.trafficHint")}</p>
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe
              title={t("mobility.traffic")}
              src="https://maps.google.com/maps?q=Diano%20Marina&t=m&z=14&layer=t&output=embed"
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
            <Bike className="size-5" /> {t("mobility.bike")}
          </h3>
          <div className="mb-2">
            <StatusBadge tone={bikeTone} label={bikeLabel} />
          </div>
          {path ? <p className="text-sm font-semibold">{path.segment}</p> : null}
          {message ? <p className="mt-1 text-sm">{message}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">{t("mobility.bikeNote")}</p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
            <iframe
              title={t("mobility.bike")}
              src="https://maps.google.com/maps?q=pista%20ciclabile%20Diano%20Marina%20San%20Bartolomeo%20al%20Mare&t=m&z=13&output=embed"
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </StatusCard>
  );
}
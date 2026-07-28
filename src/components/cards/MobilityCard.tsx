import { useQuery } from "@tanstack/react-query";
import { Car, Bike } from "lucide-react";
import { StatusCard, StatusBadge, type StatusTone } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import { fetchBikePath } from "@/lib/civic-data";

const STOPS = ["Imperia", "Diano Marina", "San Bartolomeo", "Cervo", "Andora"];

function BikeRoute({ blocked }: { blocked: boolean }) {
  // Highlight the Diano Marina - San Bartolomeo leg when the path is not fully open.
  const brokenLeg = 1;
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center">
        {STOPS.map((stop, i) => (
          <div key={stop} className="flex flex-1 items-center last:flex-none">
            <span className="size-3 shrink-0 rounded-full bg-foreground/70" aria-hidden="true" />
            {i < STOPS.length - 1 ? (
              <span
                className={
                  "h-1.5 flex-1 rounded-full " +
                  (blocked && i === brokenLeg ? "bg-status-red" : "bg-status-green")
                }
                aria-hidden="true"
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1 text-[0.7rem] font-semibold text-muted-foreground">
        {STOPS.map((stop) => (
          <span key={stop} className="flex-1 text-center first:text-left last:text-right">
            {stop}
          </span>
        ))}
      </div>
    </div>
  );
}

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
      icon={
        <span className="flex items-center gap-0.5 [&_svg]:size-6">
          <Car />
          <Bike />
        </span>
      }
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
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{t("mobility.route")}</p>
          <BikeRoute blocked={bikeTone !== "green"} />
          <p className="mt-2 text-sm">
            {bikeTone === "green" ? t("mobility.routeOk") : t("mobility.routeBlocked")}
          </p>
          {path ? <p className="text-sm font-semibold">{path.segment}</p> : null}
          {message ? <p className="mt-1 text-sm">{message}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">{t("mobility.bikeNote")}</p>
        </div>
      </div>
    </StatusCard>
  );
}
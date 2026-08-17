import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, Bike } from "lucide-react";
import { StatusCard, StatusBadge, type StatusTone } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import { fetchBikePath, fetchBikeSegments, type BikeSegment } from "@/lib/civic-data";

function BikeRoute({ segments }: { segments: BikeSegment[] }) {
  if (segments.length === 0) return null;
  const stops = [segments[0].da, ...segments.map((s) => s.a)];
  return (
    <div className="glass-soft w-full max-w-full overflow-hidden rounded-2xl p-4">
      <div className="flex items-center">
        {stops.map((stop, i) => (
          <div key={stop + i} className="flex flex-1 items-center last:flex-none">
            <span className="size-3 shrink-0 rounded-full bg-sand/80" aria-hidden="true" />
            {i < stops.length - 1 ? (
              <span
                className={
                  "h-1.5 flex-1 rounded-full " +
                  (segments[i].stato === "closed" ? "bg-status-red" : "bg-status-green")
                }
                aria-hidden="true"
                title={segments[i].nota ?? undefined}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1 text-[0.7rem] font-semibold text-muted-foreground">
        {stops.map((stop, i) => (
          <span key={stop + i} className="flex-1 text-center first:text-left last:text-right">
            {stop}
          </span>
        ))}
      </div>
      {segments.some((s) => s.stato === "closed" && s.nota) ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {segments
            .filter((s) => s.stato === "closed" && s.nota)
            .map((s) => (
              <li key={s.id}>
                <span className="font-semibold text-status-red">
                  {s.da} → {s.a}:
                </span>{" "}
                {s.nota}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}

function TrafficMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
      | string
      | undefined;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
      | string
      | undefined;
    if (!key || !ref.current) return;

    let cancelled = false;
    const init = () => {
      if (cancelled || !ref.current) return;
      const g = (window as unknown as { google?: any }).google;
      if (!g?.maps) return;
      const map = new g.maps.Map(ref.current, {
        center: { lat: 43.9135, lng: 8.075 },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });
      new g.maps.TrafficLayer().setMap(map);
    };

    const w = window as unknown as Record<string, unknown>;
    if ((w.google as { maps?: unknown } | undefined)?.maps) {
      init();
    } else {
      w.__initGolfoTraffic = init;
      const existing = document.getElementById("gmaps-js");
      if (!existing) {
        const s = document.createElement("script");
        s.id = "gmaps-js";
        s.async = true;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initGolfoTraffic${
          channel ? `&channel=${channel}` : ""
        }`;
        document.head.appendChild(s);
      }
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={ref} className="h-64 w-full max-w-full" />;
}

export function MobilityCard() {
  const { t, lang } = useI18n();
  const { data } = useQuery({
    queryKey: ["bike-path"],
    queryFn: fetchBikePath,
    staleTime: 5 * 60 * 1000,
  });
  const { data: segments } = useQuery({
    queryKey: ["bike-segments"],
    queryFn: fetchBikeSegments,
    staleTime: 5 * 60 * 1000,
  });

  const path = data?.[0];
  const anySegmentClosed = (segments ?? []).some((s) => s.stato === "closed");
  const bikeTone: StatusTone = anySegmentClosed
    ? "red"
    : path?.status === "closed"
      ? "red"
      : path?.status === "works"
        ? "yellow"
        : "green";
  const bikeLabel = bikeTone === "red" ? t("mobility.bike.closed") : t("mobility.bike.open");
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
            <Bike className="size-5" /> {t("mobility.bike")}
          </h3>
          <div className="mb-2">
            <StatusBadge tone={bikeTone} label={bikeLabel} />
          </div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{t("mobility.route")}</p>
          <BikeRoute segments={segments ?? []} />
          <p className="mt-2 text-sm">
            {bikeTone === "green" ? t("mobility.routeOk") : t("mobility.routeBlocked")}
          </p>
          {message ? <p className="mt-1 text-sm">{message}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">{t("mobility.bikeNote")}</p>
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
            <Car className="size-5" /> {t("mobility.traffic")}
          </h3>
          <p className="mb-2 text-sm text-muted-foreground">{t("mobility.trafficArea")}</p>
          <div className="w-full max-w-full overflow-hidden rounded-2xl border border-border">
            <TrafficMap />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("app.live")}</p>
        </div>
      </div>
    </StatusCard>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CloudSun, Droplets, Mountain, Zap } from "lucide-react";
import { StatusCard, DetailRow, type StatusTone } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import {
  COMUNI,
  fetchAlert,
  fetchAlertOverride,
  fetchWeather,
  overrideToDay,
  weatherDescription,
  type AlertColor,
  type AlertDay,
} from "@/lib/civic-data";

const TONE_BY_COLOR: Record<AlertColor, StatusTone> = {
  verde: "green",
  giallo: "yellow",
  arancione: "orange",
  rosso: "red",
};

const LABEL_BY_COLOR: Record<AlertColor, Record<string, string>> = {
  verde: { it: "Nessuna allerta", en: "No alert", fr: "Aucune alerte", de: "Keine Warnung" },
  giallo: {
    it: "Allerta gialla · criticità ordinaria",
    en: "Yellow alert · ordinary risk",
    fr: "Alerte jaune",
    de: "Gelbe Warnung",
  },
  arancione: {
    it: "Allerta arancione · criticità moderata",
    en: "Orange alert · moderate risk",
    fr: "Alerte orange",
    de: "Orange Warnung",
  },
  rosso: {
    it: "Allerta rossa · criticità elevata",
    en: "Red alert · high risk",
    fr: "Alerte rouge",
    de: "Rote Warnung",
  },
};

function DayBlock({ title, day }: { title: string; day: AlertDay }) {
  const { t } = useI18n();
  return (
    <div className="glass-soft rounded-2xl p-4">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mb-2 text-sm text-muted-foreground">{day.allerta.descrizione}</p>
      <dl>
        <DetailRow
          label={
            <span className="flex items-center gap-1">
              <Droplets className="size-4" /> {t("weather.hydraulic")}
            </span>
          }
          value={day.dettagli.idraulico}
        />
        <DetailRow
          label={
            <span className="flex items-center gap-1">
              <Mountain className="size-4" /> {t("weather.hydro")}
            </span>
          }
          value={day.dettagli.idrogeologico}
        />
        <DetailRow
          label={
            <span className="flex items-center gap-1">
              <Zap className="size-4" /> {t("weather.storms")}
            </span>
          }
          value={day.dettagli.temporali}
        />
      </dl>
    </div>
  );
}

export function WeatherCard() {
  const { t, lang } = useI18n();
  const [slug, setSlug] = useState<string>(COMUNI[0].slug);
  const comune = COMUNI.find((c) => c.slug === slug) ?? COMUNI[0];

  const alertQuery = useQuery({
    queryKey: ["alert", slug],
    queryFn: () => fetchAlert(slug),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const overrideQuery = useQuery({
    queryKey: ["allerta-override"],
    queryFn: fetchAlertOverride,
    staleTime: 5 * 60 * 1000,
  });
  const weatherQuery = useQuery({
    queryKey: ["weather", comune.lat, comune.lon],
    queryFn: () => fetchWeather(comune.lat, comune.lon),
    staleTime: 15 * 60 * 1000,
  });

  const overrideOggi = overrideQuery.data?.find((o) => o.giorno === "oggi" && o.attivo);
  const overrideDomani = overrideQuery.data?.find((o) => o.giorno === "domani" && o.attivo);
  // L'override, quando è attivo, ha sempre la precedenza: è una scelta
  // esplicita e manuale dell'amministratore, non un semplice ripiego
  // legato alla disponibilità della fonte ufficiale.
  const usingOverride = !!overrideOggi;
  const oggi = overrideOggi ? overrideToDay(overrideOggi) : alertQuery.data?.oggi;
  const domani = overrideDomani ? overrideToDay(overrideDomani) : alertQuery.data?.domani;

  const color = oggi?.allerta.colore;
  const tone: StatusTone = color ? TONE_BY_COLOR[color] : "grey";
  const statusLabel = color
    ? (LABEL_BY_COLOR[color][lang] ?? LABEL_BY_COLOR[color].en)
    : alertQuery.isLoading
      ? t("app.loading")
      : t("app.error");

  const conditions = weatherQuery.data
    ? weatherDescription(weatherQuery.data.code, lang)
    : null;

  const summary = weatherQuery.data
    ? `${comune.name} · ${conditions} · ${weatherQuery.data.temperature}°C (${weatherQuery.data.minToday}° / ${weatherQuery.data.maxToday}°)`
    : comune.name;

  return (
    <StatusCard
      title={t("card.weather")}
      icon={<CloudSun />}
      tone={tone}
      statusLabel={statusLabel}
      summary={summary}
    >
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-muted-foreground">
          {t("weather.comune")}
        </span>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-base font-medium"
        >
          {COMUNI.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {weatherQuery.data ? (
        <>
          <div className="glass-soft mb-3 rounded-2xl p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              {t("weather.conditions")}
            </p>
            <p className="text-2xl font-bold">{conditions}</p>
          </div>
          <div className="mb-4 flex gap-3">
          <div className="glass-soft flex-1 rounded-2xl p-4">
            <p className="text-sm font-semibold text-muted-foreground">{t("weather.temp")}</p>
            <p className="text-3xl font-bold">{weatherQuery.data.temperature}°C</p>
          </div>
          <div className="glass-soft flex-1 rounded-2xl p-4">
            <p className="text-sm font-semibold text-muted-foreground">{t("weather.wind")}</p>
            <p className="text-3xl font-bold">{weatherQuery.data.wind} km/h</p>
          </div>
          </div>
        </>
      ) : null}

      {oggi ? (
        <div className="grid gap-3">
          {usingOverride ? (
            <p className="rounded-xl bg-status-yellow/15 px-3 py-2 text-xs font-semibold text-status-yellow">
              ⚠ {t("weather.overrideActive")}
            </p>
          ) : null}
          <DayBlock title={t("weather.today")} day={oggi} />
          {domani ? <DayBlock title={t("weather.tomorrow")} day={domani} /> : null}
          {alertQuery.data?.bulletin_info?.data_bollettino ? (
            <p className="text-sm text-muted-foreground">
              {t("weather.bulletin")}: {alertQuery.data.bulletin_info.data_bollettino}{" "}
              {alertQuery.data.bulletin_info.ora_bollettino}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {alertQuery.isLoading ? t("app.loading") : t("app.error")}
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {t("weather.source")} · {t("app.live")}
      </p>
    </StatusCard>
  );
}
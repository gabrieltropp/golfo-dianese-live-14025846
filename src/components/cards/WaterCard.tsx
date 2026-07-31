import { useQuery } from "@tanstack/react-query";
import { Droplet, Wrench, CheckCircle2, ExternalLink, CalendarClock } from "lucide-react";
import { StatusCard, StatusBadge, FreshnessNote } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import {
  fetchAvvisi,
  fetchFontiStato,
  freshnessOf,
  golfoComuniOf,
  rivieracquaAvvisi,
  type Avviso,
} from "@/lib/civic-data";
import { useAutoTranslate } from "@/lib/use-auto-translate";

const RIVIERACQUA_URL = "https://rivieracqua.it/category/avvisi/";

function AdvisoryItem({ a, tr }: { a: Avviso; tr: (s: string) => string }) {
  const { t, lang } = useI18n();
  const golfo = golfoComuniOf(a);

  return (
    <li className="glass-soft rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StatusBadge tone="yellow" label={t("water.kind.works")} />
        {a.data_pubblicazione ? (
          <span className="text-xs text-muted-foreground">
            {t("water.published")}: {new Date(a.data_pubblicazione).toLocaleDateString(lang)}
          </span>
        ) : null}
      </div>
      <p className="text-base font-bold leading-tight">{tr(a.titolo)}</p>
      {a.data_intervento ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          {t("water.intervention")}: {tr(a.data_intervento)}
        </p>
      ) : null}
      {a.testo_breve ? <p className="mt-1 text-sm">{tr(a.testo_breve)}</p> : null}
      {golfo.length > 0 ? (
        <p className="mt-2 text-sm">
          {t("water.involved")}:{" "}
          {golfo.map((c, i) => (
            <span key={c}>
              {i > 0 ? ", " : ""}
              <strong>{c}</strong>
            </span>
          ))}
        </p>
      ) : null}
      <a
        href={a.url}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
      >
        {t("comuni.open")} <ExternalLink className="size-3" />
      </a>
    </li>
  );
}

export function WaterCard() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["avvisi"],
    queryFn: fetchAvvisi,
    staleTime: 5 * 60 * 1000,
  });
  const { data: fonti } = useQuery({
    queryKey: ["fonti-stato"],
    queryFn: fetchFontiStato,
    staleTime: 5 * 60 * 1000,
  });

  const active = rivieracquaAvvisi(data ?? []);
  const tr = useAutoTranslate(
    active.flatMap((a) => [a.titolo, a.testo_breve ?? "", a.data_intervento ?? ""]).filter(Boolean),
  );

  const stato = (fonti ?? []).find((f) => f.fonte === "Rivieracqua");
  const fresh = freshnessOf(fonti, ["Rivieracqua"]);

  return (
    <StatusCard
      title={t("card.water")}
      icon={active.length > 0 ? <Wrench /> : <Droplet />}
      tone={active.length > 0 ? "yellow" : "green"}
      statusLabel={
        isLoading
          ? t("app.loading")
          : active.length > 0
            ? `${active.length} ${t("comuni.notices")}`
            : t("water.none")
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("app.loading")}</p>
      ) : active.length === 0 ? (
        <p className="flex items-start gap-2 text-status-green">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> {t("water.noneGolfo")}
        </p>
      ) : (
        <ul className="grid gap-3">
          {active.map((a) => (
            <AdvisoryItem key={a.id} a={a} tr={tr} />
          ))}
        </ul>
      )}
      {stato && !stato.ok ? (
        <p className="mt-3 text-xs text-status-red">{t("comuni.sourceError")}: Rivieracqua</p>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">{t("water.source")}</p>
      <FreshnessNote
        lastSuccessAt={fresh.lastSuccessAt}
        failStreak={fresh.failStreak}
        locale={lang}
      />
      <a
        href={RIVIERACQUA_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        rivieracqua.it {t("water.official")} <ExternalLink className="size-4" />
      </a>
    </StatusCard>
  );
}

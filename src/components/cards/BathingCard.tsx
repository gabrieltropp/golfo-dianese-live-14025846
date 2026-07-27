import { useQuery } from "@tanstack/react-query";
import { Waves, ExternalLink, Info } from "lucide-react";
import { StatusCard, DetailRow, type StatusTone } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import { ARPAL_URL, fetchBathingWater } from "@/lib/civic-data";

export function BathingCard() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["bathing-water"],
    queryFn: fetchBathingWater,
    staleTime: 5 * 60 * 1000,
  });

  const point = data?.[0];
  const tone: StatusTone =
    point?.status === "compliant" ? "green" : point?.status === "non_compliant" ? "red" : "grey";
  const statusLabel = !point
    ? isLoading
      ? t("app.loading")
      : t("bathing.unknown")
    : point.status === "compliant"
      ? t("bathing.compliant")
      : point.status === "non_compliant"
        ? t("bathing.nonCompliant")
        : t("bathing.unknown");

  const sampled = point?.last_sampled_on
    ? new Date(point.last_sampled_on).toLocaleDateString(lang)
    : "—";

  return (
    <StatusCard
      title={t("card.bathing")}
      icon={<Waves />}
      tone={tone}
      statusLabel={statusLabel}
      summary={point?.beach_name}
    >
      <p className="mb-3">{t("bathing.explain")}</p>
      <p className="mb-4 flex gap-2 rounded-2xl bg-coral/15 p-3 text-sm">
        <Info className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
        <span>{t("bathing.frequency")}</span>
      </p>
      <dl className="mb-4">
        <DetailRow label={t("bathing.point")} value={point?.water_code ?? "IT007008027A001"} />
        <DetailRow label={t("bathing.lastSample")} value={sampled} />
        {point?.notes ? <DetailRow label="Note" value={point.notes} /> : null}
      </dl>
      <a
        href={point?.source_url ?? ARPAL_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
      >
        {t("bathing.official")} <ExternalLink className="size-4" />
      </a>
    </StatusCard>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Droplet, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusCard, StatusBadge, type StatusTone } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import { fetchWaterAdvisories, type WaterAdvisory } from "@/lib/civic-data";

function AdvisoryItem({ a }: { a: WaterAdvisory }) {
  const { t, lang } = useI18n();
  const tone: StatusTone = a.kind === "outage" ? "red" : "yellow";
  return (
    <li className="rounded-2xl border border-border bg-secondary/50 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StatusBadge tone={tone} label={t(`water.kind.${a.kind}`)} />
        <span className="text-xs text-muted-foreground">
          {t("water.published")}: {new Date(a.published_at).toLocaleDateString(lang)}
        </span>
      </div>
      <p className="text-lg font-bold leading-tight">{a.zone}</p>
      {a.description ? <p className="mt-1 text-sm">{a.description}</p> : null}
      {a.expected_restore_at ? (
        <p className="mt-2 text-sm font-semibold">
          {t("water.restore")}:{" "}
          {new Date(a.expected_restore_at).toLocaleString(lang, {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      ) : null}
    </li>
  );
}

export function WaterCard() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["water-advisories"],
    queryFn: fetchWaterAdvisories,
    staleTime: 2 * 60 * 1000,
  });

  const active = (data ?? []).filter((a) => a.is_active);
  const hasOutage = active.some((a) => a.kind === "outage");
  const tone: StatusTone = hasOutage ? "red" : active.length > 0 ? "yellow" : "green";
  const statusLabel = isLoading
    ? t("app.loading")
    : hasOutage
      ? t("water.outage")
      : active.length > 0
        ? t("water.planned")
        : t("water.none");

  const icon = hasOutage ? <AlertTriangle /> : active.length > 0 ? <Wrench /> : <Droplet />;

  return (
    <StatusCard title={t("card.water")} icon={icon} tone={tone} statusLabel={statusLabel}>
      {active.length === 0 ? (
        <p className="flex items-center gap-2 text-status-green">
          <CheckCircle2 className="size-5" /> {t("water.none")}
        </p>
      ) : (
        <ul className="grid gap-3">
          {active.map((a) => (
            <AdvisoryItem key={a.id} a={a} />
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">{t("water.source")}</p>
    </StatusCard>
  );
}
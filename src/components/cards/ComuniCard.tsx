import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, CheckCircle2 } from "lucide-react";
import { StatusCard, StatusBadge } from "@/components/StatusCard";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { COMUNI, fetchWaterAdvisories, type WaterAdvisory } from "@/lib/civic-data";

function ComuneRow({ name, advisories }: { name: string; advisories: WaterAdvisory[] }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex-1 text-base font-bold">{name}</span>
        <StatusBadge
          tone={advisories.length > 0 ? "yellow" : "green"}
          label={
            advisories.length > 0
              ? `${advisories.length} ${t("comuni.notices")}`
              : t("comuni.noNotices")
          }
        />
        <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-3">
          {advisories.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-status-green">
              <CheckCircle2 className="size-4" /> {t("comuni.noNotices")}
            </p>
          ) : (
            <ul className="grid gap-2">
              {advisories.map((a) => (
                <li key={a.id} className="rounded-xl bg-card p-3">
                  <p className="text-sm font-bold">{a.zone}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`water.kind.${a.kind}`)} ·{" "}
                    {new Date(a.published_at).toLocaleDateString(lang)}
                  </p>
                  {a.description ? <p className="mt-1 text-sm">{a.description}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function ComuniCard() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["water-advisories"],
    queryFn: fetchWaterAdvisories,
    staleTime: 2 * 60 * 1000,
  });

  const active = (data ?? []).filter((a) => a.is_active);
  const total = active.length;

  return (
    <StatusCard
      title={t("card.comuni")}
      icon={<Building2 />}
      tone={total > 0 ? "yellow" : "green"}
      statusLabel={total > 0 ? `${total} ${t("comuni.notices")}` : t("comuni.noNotices")}
      summary={t("comuni.subtitle")}
    >
      <ul className="grid gap-2">
        {COMUNI.map((c) => (
          <ComuneRow
            key={c.slug}
            name={c.name}
            advisories={active.filter((a) => a.comune === c.name)}
          />
        ))}
      </ul>
    </StatusCard>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, CheckCircle2, ExternalLink } from "lucide-react";
import { StatusCard, StatusBadge } from "@/components/StatusCard";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { COMUNI, comuneAvvisi, fetchAvvisi, fetchFontiStato, type Avviso } from "@/lib/civic-data";
import { useAutoTranslate } from "@/lib/use-auto-translate";

function ComuneRow({ name, avvisi }: { name: string; avvisi: Avviso[] }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const tr = useAutoTranslate(
    open ? avvisi.flatMap((a) => [a.titolo, a.testo_breve ?? ""]).filter(Boolean) : [],
  );

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
          tone={avvisi.length > 0 ? "yellow" : "green"}
          label={
            avvisi.length > 0
              ? `${avvisi.length} ${t("comuni.notices")}`
              : t("comuni.noNotices")
          }
        />
        <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-3">
          {avvisi.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-status-green">
              <CheckCircle2 className="size-4" /> {t("comuni.sourceUnavailable")}
            </p>
          ) : (
            <ul className="grid gap-2">
              {avvisi.map((a) => (
                <li key={a.id} className="rounded-xl bg-card p-3">
                  <p className="text-sm font-bold">{tr(a.titolo)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.fonte}
                    {a.data_pubblicazione
                      ? ` · ${new Date(a.data_pubblicazione).toLocaleDateString(lang)}`
                      : ""}
                  </p>
                  {a.testo_breve ? <p className="mt-1 text-sm">{tr(a.testo_breve)}</p> : null}
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    {t("comuni.open")} <ExternalLink className="size-3" />
                  </a>
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

  const avvisi = data ?? [];
  const total = avvisi.length;
  const failing = (fonti ?? []).filter((f) => !f.ok);
  const lastCheck = (fonti ?? [])
    .map((f) => f.fetched_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <StatusCard
      title={t("card.comuni")}
      icon={<Building2 />}
      tone={total > 0 ? "yellow" : "green"}
      statusLabel={
        isLoading
          ? t("app.loading")
          : total > 0
            ? `${total} ${t("comuni.notices")}`
            : t("comuni.sourceUnavailable")
      }
      summary={t("comuni.subtitle")}
    >
      <ul className="grid gap-2">
        {COMUNI.map((c) => (
          <ComuneRow key={c.slug} name={c.name} avvisi={avvisi.filter((a) => a.comune === c.name)} />
        ))}
      </ul>
      {failing.length > 0 ? (
        <p className="mt-3 text-xs text-status-red">
          {t("comuni.sourceError")}: {failing.map((f) => f.fonte).join(", ")}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        {t("comuni.sources")}
        {lastCheck ? ` · ${t("comuni.lastCheck")}: ${new Date(lastCheck).toLocaleString(lang)}` : ""}
      </p>
    </StatusCard>
  );
}
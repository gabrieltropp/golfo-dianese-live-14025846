import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Waves, ExternalLink, Info } from "lucide-react";
import { StatusCard, DetailRow, FreshnessNote, type StatusTone } from "@/components/StatusCard";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  ARPAL_URL,
  fetchBalneazione,
  fetchFontiStato,
  freshnessOf,
  isBathingSeason,
  type BalneazionePoint,
} from "@/lib/civic-data";

const DOT: Record<BalneazionePoint["stato"], string> = {
  compliant: "bg-status-green",
  non_compliant: "bg-status-red",
  unknown: "bg-muted-foreground/50",
};

const GLOW: Record<BalneazionePoint["stato"], string> = {
  compliant: "shadow-[0_0_0_4px_var(--status-green)]/20",
  non_compliant: "shadow-[0_0_0_4px_var(--status-red)]/20",
  unknown: "",
};

/**
 * Signature element: a "coastal horizon" — a thin shoreline with each ARPAL
 * monitoring point rendered as a small lit buoy on a mast.
 */
function CoastalHorizon({
  points,
  selected,
  onSelect,
}: {
  points: BalneazionePoint[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="glass-soft w-full max-w-full overflow-hidden rounded-2xl px-3 pb-3 pt-5">
      <div className="relative flex w-full items-end">
        {points.map((p) => {
          const active = selected === p.codice_acqua;
          return (
            <button
              key={p.codice_acqua}
              type="button"
              title={p.nome_punto}
              aria-label={p.nome_punto}
              aria-pressed={active}
              onClick={() => onSelect(p.codice_acqua)}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg pb-1"
            >
              <span
                className={cn(
                  "size-3 rounded-full transition-transform",
                  DOT[p.stato],
                  GLOW[p.stato],
                  active && "scale-150",
                )}
                aria-hidden="true"
              />
              <span
                className={cn("h-3 w-px", active ? "bg-sand/80" : "bg-sand/35")}
                aria-hidden="true"
              />
            </button>
          );
        })}
        {/* shoreline */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sand/60 to-transparent"
        />
      </div>
      <div className="mt-2 flex justify-between text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>Ovest · Imperia</span>
        <span>Est · Cervo</span>
      </div>
    </div>
  );
}

export function BathingCard() {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["balneazione"],
    queryFn: fetchBalneazione,
    staleTime: 30 * 60 * 1000,
  });
  const { data: fonti } = useQuery({
    queryKey: ["fonti-stato"],
    queryFn: fetchFontiStato,
    staleTime: 5 * 60 * 1000,
  });
  const fresh = freshnessOf(fonti, ["ARPAL Balneazione"]);

  const points = data ?? [];
  const hasData = points.length > 0;
  const bad = points.filter((p) => p.stato === "non_compliant");
  const known = points.filter((p) => p.stato !== "unknown");

  const tone: StatusTone = !hasData || known.length === 0 ? "grey" : bad.length > 0 ? "red" : "green";
  const statusLabel = isLoading
    ? t("app.loading")
    : !hasData || isError || known.length === 0
      ? t("bathing.unknown")
      : bad.length > 0
        ? `${bad.length} ${t("bathing.nonCompliant")}`
        : t("bathing.compliant");

  const current = points.find((p) => p.codice_acqua === selected) ?? null;

  const byComune = points.reduce<Record<string, BalneazionePoint[]>>((acc, p) => {
    (acc[p.comune] ??= []).push(p);
    return acc;
  }, {});

  return (
    <StatusCard
      title={t("card.bathing")}
      icon={<Waves />}
      tone={tone}
      statusLabel={statusLabel}
      summary={hasData ? `${points.length} ${t("bathing.points")}` : undefined}
    >
      <p className="mb-3">{t("bathing.explain")}</p>
      {!isBathingSeason() ? (
        <p className="mb-3 text-sm text-muted-foreground">{t("bathing.offSeason")}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("app.loading")}</p>
      ) : !hasData ? (
        <p className="rounded-2xl bg-secondary/60 p-3 text-sm">{t("bathing.noData")}</p>
      ) : (
        <>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{t("bathing.strip")}</p>
          <CoastalHorizon points={points} selected={selected} onSelect={setSelected} />

          <ul className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-status-green" /> {t("bathing.legend.ok")}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-status-red" /> {t("bathing.legend.ko")}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-muted-foreground/50" />{" "}
              {t("bathing.legend.unknown")}
            </li>
          </ul>

          {current ? (
            <dl className="glass-soft mt-4 rounded-2xl p-3">
              <DetailRow label={t("bathing.point")} value={current.nome_punto} />
              <DetailRow label="Comune" value={current.comune} />
              <DetailRow
                label={t("bathing.compliant")}
                value={current.stato_raw ?? t("bathing.unknown")}
              />
              {current.classificazione ? (
                <DetailRow label="Classificazione" value={current.classificazione} />
              ) : null}
              {current.motivo ? <DetailRow label="Nota" value={current.motivo} /> : null}
              <DetailRow
                label={t("bathing.lastSample")}
                value={
                  current.data_ultimo_controllo
                    ? new Date(current.data_ultimo_controllo).toLocaleDateString(lang)
                    : "—"
                }
              />
              <DetailRow label="Codice" value={current.codice_acqua} />
            </dl>
          ) : null}

          <div className="mt-4 grid gap-3">
            {Object.entries(byComune).map(([comune, list]) => (
              <div key={comune}>
                <p className="mb-1 text-sm font-bold">
                  {comune} · {list.length} {t("bathing.points")}
                </p>
                <ul className="grid gap-1">
                  {list.map((p) => (
                    <li key={p.codice_acqua}>
                      <button
                        type="button"
                        onClick={() => setSelected(p.codice_acqua)}
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-sm hover:bg-sand/10"
                      >
                        <span className={cn("size-3 shrink-0 rounded-full", DOT[p.stato])} />
                        <span className="flex-1">{p.nome_punto}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.stato === "compliant"
                            ? t("bathing.legend.ok")
                            : p.stato === "non_compliant"
                              ? t("bathing.legend.ko")
                              : t("bathing.legend.unknown")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-4 flex gap-2 rounded-2xl bg-coral/20 p-3 text-sm">
        <Info className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
        <span>{t("bathing.frequency")}</span>
      </p>
      <FreshnessNote
        lastSuccessAt={fresh.lastSuccessAt}
        failStreak={fresh.failStreak}
        locale={lang}
      />
      <a
        href={current?.source_url ?? points[0]?.source_url ?? ARPAL_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
      >
        {t("bathing.official")} <ExternalLink className="size-4" />
      </a>
    </StatusCard>
  );
}
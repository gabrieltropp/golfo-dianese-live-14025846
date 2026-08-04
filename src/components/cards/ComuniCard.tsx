import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, CheckCircle2, ExternalLink, Users } from "lucide-react";
import { StatusCard, StatusBadge, FreshnessNote } from "@/components/StatusCard";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  COMUNI,
  comuneAvvisi,
  fetchAvvisi,
  fetchFontiStato,
  freshnessOf,
  type Avviso,
} from "@/lib/civic-data";
import { useAutoTranslate } from "@/lib/use-auto-translate";
import { SegnalaForm } from "@/components/SegnalaForm";
import {
  fetchSegnalazioniVerificate,
  segnalazioniOf,
  type Segnalazione,
} from "@/lib/segnalazioni";

function ComuneRow({
  name,
  avvisi,
  segnalazioni,
}: {
  name: string;
  avvisi: Avviso[];
  segnalazioni: Segnalazione[];
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const tr = useAutoTranslate(
    open ? avvisi.flatMap((a) => [a.titolo, a.testo_breve ?? ""]).filter(Boolean) : [],
  );
  const total = avvisi.length + segnalazioni.length;

  return (
    <li className="glass-soft overflow-hidden rounded-2xl">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex-1 text-base font-bold">{name}</span>
        <StatusBadge
          tone={total > 0 ? "yellow" : "green"}
          label={total > 0 ? `${total} ${t("comuni.notices")}` : t("comuni.noNotices")}
        />
        <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-3">
          {total === 0 ? (
            <p className="flex items-center gap-2 text-sm text-status-green">
              <CheckCircle2 className="size-4" /> {t("comuni.sourceUnavailable")}
            </p>
          ) : (
            <ul className="grid gap-2">
              {avvisi.map((a) => (
                <li key={a.id} className="rounded-xl bg-sand/5 p-3">
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
              {segnalazioni.map((s) => (
                <li key={s.id} className="rounded-xl border border-accent/40 bg-accent/10 p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2 py-0.5 text-[0.7rem] font-bold text-accent">
                    <Users className="size-3" aria-hidden="true" />
                    {t("report.verified")}{" "}
                    {new Date(s.data_verifica ?? s.data_invio).toLocaleDateString(lang)}
                  </p>
                  <p className="text-sm">{s.testo}</p>
                  {s.categoria ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t(`cat.${s.categoria}`)}</p>
                  ) : null}
                  {s.foto_url ? (
                    <img
                      src={s.foto_url}
                      alt=""
                      loading="lazy"
                      className="mt-2 max-h-48 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  {s.fonte_verifica_url ? (
                    <a
                      href={s.fonte_verifica_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      {t("report.sourceLink")} <ExternalLink className="size-3" />
                    </a>
                  ) : null}
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
  const { data: segnalazioni } = useQuery({
    queryKey: ["segnalazioni"],
    queryFn: fetchSegnalazioniVerificate,
    staleTime: 5 * 60 * 1000,
  });

  const avvisi = (data ?? []).filter((a) => a.fonte !== "Rivieracqua");
  const total = COMUNI.reduce(
    (n, c) => n + comuneAvvisi(avvisi, c.name).length + segnalazioniOf(segnalazioni, c.name).length,
    0,
  );
  const failing = (fonti ?? []).filter((f) => !f.ok);
  const fresh = freshnessOf(fonti, [
    "Comune di Diano Marina",
    "Comune di San Bartolomeo al Mare",
    "Comune di Cervo",
  ]);

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
          <ComuneRow
            key={c.slug}
            name={c.name}
            avvisi={comuneAvvisi(avvisi, c.name)}
            segnalazioni={segnalazioniOf(segnalazioni, c.name)}
          />
        ))}
      </ul>
      {failing.length > 0 ? (
        <p className="mt-3 text-xs text-status-red">
          {t("comuni.sourceError")}: {failing.map((f) => f.fonte).join(", ")}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">{t("comuni.sources")}</p>
      <FreshnessNote
        lastSuccessAt={fresh.lastSuccessAt}
        failStreak={fresh.failStreak}
        locale={lang}
      />
    </StatusCard>
  );
}
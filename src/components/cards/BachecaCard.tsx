import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageSquareHeart, Users } from "lucide-react";
import { StatusCard } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import { fetchSegnalazioniVerificate, type Segnalazione } from "@/lib/segnalazioni";
import { useContentTranslate } from "@/lib/use-auto-translate";

function BachecaItem({
  s,
  tr,
}: {
  s: Segnalazione;
  tr: (id: string, campo: string, fallback: string) => string;
}) {
  const { t, lang } = useI18n();
  const when = s.data_verifica ?? s.data_invio;

  return (
    <li className="glass-soft rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-[0.7rem] font-bold text-accent">
          <Users className="size-3" aria-hidden="true" />
          {t("report.verified")} {new Date(when).toLocaleDateString(lang)}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">{s.comune}</span>
        {s.categoria ? (
          <span className="text-xs text-muted-foreground">· {t(`cat.${s.categoria}`)}</span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed">{tr(s.id, "testo", s.testo)}</p>
      {s.foto_url ? (
        <img
          src={s.foto_url}
          alt=""
          loading="lazy"
          className="mt-2 max-h-48 w-full rounded-xl object-cover"
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
  );
}

/** Community board: verified reports only, newest verification first. */
export function BachecaCard() {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["segnalazioni"],
    queryFn: fetchSegnalazioniVerificate,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const items = [...(data ?? [])].sort(
    (a, b) =>
      new Date(b.data_verifica ?? b.data_invio).getTime() -
      new Date(a.data_verifica ?? a.data_invio).getTime(),
  );
  const tr = useContentTranslate(items.map((s) => ({ id: s.id, campo: "testo", testo: s.testo })));

  return (
    <StatusCard
      title={t("bacheca.title")}
      eyebrow={t("bacheca.eyebrow")}
      icon={<MessageSquareHeart />}
      tone={items.length > 0 ? "yellow" : "green"}
      statusLabel={
        isLoading
          ? t("app.loading")
          : items.length > 0
            ? `${items.length} ${t("bacheca.count")}`
            : t("report.none")
      }
      summary={t("bacheca.subtitle")}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("app.loading")}</p>
      ) : isError ? (
        <div className="glass-soft rounded-2xl p-4 text-sm">
          <p className="mb-2 text-status-red">{t("app.error")}</p>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {isRefetching ? "…" : t("app.retry")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="glass-soft rounded-2xl p-4 text-sm text-muted-foreground">
          {t("bacheca.empty")}
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((s) => (
            <BachecaItem key={s.id} s={s} tr={tr} />
          ))}
        </ul>
      )}
    </StatusCard>
  );
}
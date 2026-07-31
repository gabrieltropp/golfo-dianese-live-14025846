import { useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export type StatusTone = "green" | "yellow" | "orange" | "red" | "grey";

const TONE_BG: Record<StatusTone, string> = {
  green: "bg-status-green text-status-green-foreground",
  yellow: "bg-status-yellow text-status-yellow-foreground",
  orange: "bg-status-orange text-status-orange-foreground",
  red: "bg-status-red text-status-red-foreground",
  grey: "bg-status-grey text-status-grey-foreground",
};

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold tracking-wide",
        TONE_BG[tone],
      )}
    >
      {label}
    </span>
  );
}

/**
 * Freshness note: shows the last SUCCESSFUL update of a source and warns loudly
 * when the scraper has failed several consecutive runs.
 */
export function FreshnessNote({
  lastSuccessAt,
  failStreak = 0,
  locale,
}: {
  lastSuccessAt: string | null | undefined;
  failStreak?: number;
  locale: string;
}) {
  const { t } = useI18n();
  const stale = failStreak >= 3;
  const when = lastSuccessAt
    ? new Date(lastSuccessAt).toLocaleString(locale, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (stale) {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-status-red/20 px-3 py-2 text-xs font-semibold text-status-red">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          {t("app.staleSince")} {when ?? "—"}
        </span>
      </p>
    );
  }

  return (
    <p className="mt-3 text-xs text-muted-foreground">
      {t("app.lastSuccess")}: {when ?? "—"}
    </p>
  );
}

export function StatusCard({
  title,
  eyebrow,
  icon,
  tone,
  statusLabel,
  summary,
  children,
}: {
  title: string;
  eyebrow?: string;
  icon: ReactNode;
  tone: StatusTone;
  statusLabel: string;
  summary?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <section className="glass overflow-hidden rounded-3xl">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-sand/5"
      >
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl [&_svg]:size-8 sm:size-16 sm:[&_svg]:size-9",
            TONE_BG[tone],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] text-accent/90">
            {eyebrow ?? t("app.eyebrow")}
          </span>
          <span className="font-display mt-0.5 block text-xl font-bold leading-tight text-foreground">
            {title}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={tone} label={statusLabel} />
          </span>
          {summary ? (
            <span className="mt-2 block text-sm text-muted-foreground">{summary}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-6 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-label={open ? t("app.close") : t("app.tapDetail")}
        />
      </button>
      {open ? (
        <div className="border-t border-border px-5 pb-6 pt-4 text-[0.95rem] leading-relaxed">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function DetailRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/70 py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground sm:max-w-[65%]">{value}</dd>
    </div>
  );
}
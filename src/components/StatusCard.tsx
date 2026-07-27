import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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

export function StatusCard({
  title,
  icon,
  tone,
  statusLabel,
  summary,
  children,
}: {
  title: string;
  icon: ReactNode;
  tone: StatusTone;
  statusLabel: string;
  summary?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <section className="card-elevated overflow-hidden rounded-3xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-secondary/60"
      >
        <span
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-2xl [&_svg]:size-9",
            TONE_BG[tone],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold leading-tight text-foreground">{title}</span>
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
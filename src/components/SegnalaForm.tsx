import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, ShieldCheck } from "lucide-react";
import { StatusCard } from "@/components/StatusCard";
import { useI18n } from "@/lib/i18n";
import {
  SEGNALAZIONI_CATEGORIE,
  SEGNALAZIONI_COMUNI,
  submitSegnalazione,
} from "@/lib/segnalazioni";

export function SegnalaForm() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [count, setCount] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setBusy(true);
    setMsg(null);
    try {
      await submitSegnalazione(new FormData(formEl));
      formEl.reset();
      setCount(0);
      setMsg({ tone: "ok", text: t("report.ok") });
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
    } catch (err) {
      const rate = err instanceof Error && err.message === "rate_limited";
      setMsg({ tone: "err", text: rate ? t("report.errRate") : t("report.err") });
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground";

  return (
    <StatusCard
      title={t("report.title")}
      eyebrow={t("bacheca.eyebrow")}
      icon={<Megaphone />}
      tone="green"
      statusLabel={t("report.cta")}
      summary={t("report.intro")}
    >
      <p className="mb-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t("report.intro")}
      </p>
      <form onSubmit={onSubmit} className="grid gap-3">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <label className="grid gap-1 text-sm font-semibold">
            {t("report.comune")}
            <select name="comune" required defaultValue="" className={field}>
              <option value="" disabled>
                —
              </option>
              {SEGNALAZIONI_COMUNI.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t("report.text")}
            <textarea
              name="testo"
              required
              minLength={10}
              maxLength={500}
              rows={4}
              onChange={(e) => setCount(e.target.value.length)}
              className={field}
            />
            <span className="text-xs font-normal text-muted-foreground">
              {count}/500 · {t("report.textHint")}
            </span>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t("report.category")}
            <select name="categoria" defaultValue="" className={field}>
              <option value="">—</option>
              {SEGNALAZIONI_CATEGORIE.map((c) => (
                <option key={c} value={c}>
                  {t(`cat.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t("report.photo")}
            <input type="file" name="foto" accept="image/*" className={field} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t("report.contact")}
            <input type="email" name="contatto" maxLength={200} className={field} />
            <span className="text-xs font-normal text-muted-foreground">
              {t("report.contactNote")}
            </span>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground disabled:opacity-60"
          >
            {busy ? t("report.sending") : t("report.send")}
          </button>
          {msg ? (
            <p
              className={
                "text-sm font-semibold " +
                (msg.tone === "ok" ? "text-status-green" : "text-status-red")
              }
            >
              {msg.text}
            </p>
          ) : null}
      </form>
    </StatusCard>
  );
}
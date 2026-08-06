import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  fetchBathingWater,
  fetchBikePath,
  fetchFontiStato,
  fetchWaterAdvisories,
  STALE_AFTER_FAILURES,
} from "@/lib/civic-data";
import { fetchSegnalazioniInAttesa, type SegnalazioneAdmin } from "@/lib/segnalazioni";

function ReportRow({ s, locale, onDone }: { s: SegnalazioneAdmin; locale: string; onDone: () => void }) {
  const { t } = useI18n();
  const [testo, setTesto] = useState(s.testo);
  const [fonte, setFonte] = useState("");
  const [nota, setNota] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify() {
    if (!/^https?:\/\//i.test(fonte)) return toast.error(t("admin.sourceUrl"));
    setBusy(true);
    const { error } = await supabase
      .from("segnalazioni")
      .update({
        testo,
        stato: "verificata",
        fonte_verifica_url: fonte,
        note_moderazione: nota || null,
        data_verifica: new Date().toISOString(),
      })
      .eq("id", s.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("OK");
    onDone();
  }

  async function reject() {
    setBusy(true);
    const { error } = await supabase
      .from("segnalazioni")
      .update({ stato: "rifiutata", note_moderazione: nota || null, data_verifica: new Date().toISOString() })
      .eq("id", s.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("OK");
    onDone();
  }

  const input = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

  return (
    <li className="grid gap-2 rounded-2xl border border-border p-4">
      <p className="text-sm font-bold">
        {s.comune}
        {s.categoria ? ` · ${t(`cat.${s.categoria}`)}` : ""} ·{" "}
        <span className="font-normal text-muted-foreground">
          {new Date(s.data_invio).toLocaleString(locale)}
        </span>
      </p>
      <textarea value={testo} onChange={(e) => setTesto(e.target.value)} rows={3} className={input} />
      {s.foto_url ? (
        <img src={s.foto_url} alt="" className="max-h-56 w-full rounded-xl object-cover" />
      ) : null}
      {s.contatto ? (
        <p className="text-xs text-muted-foreground">
          {t("admin.contact")}: {s.contatto}
        </p>
      ) : null}
      <input
        placeholder={t("admin.sourceUrl")}
        value={fonte}
        onChange={(e) => setFonte(e.target.value)}
        className={input}
      />
      <input
        placeholder={t("admin.moderationNote")}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        className={input}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={verify}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {t("admin.verify")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reject}
          className="rounded-xl border border-destructive px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60"
        >
          {t("admin.reject")}
        </button>
      </div>
    </li>
  );
}

function ReportsQueue({ locale }: { locale: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["segnalazioni-attesa"], queryFn: fetchSegnalazioniInAttesa });
  const rows = data ?? [];
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["segnalazioni-attesa"] });
    qc.invalidateQueries({ queryKey: ["segnalazioni"] });
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("admin.reports")}</h2>
        <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
          {rows.length} {t("admin.pendingCount")}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.noPending")}</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((s) => (
            <ReportRow key={s.id} s={s} locale={locale} onDone={refresh} />
          ))}
        </ul>
      )}
    </section>
  );
}

function UpdateStatusPanel({ locale }: { locale: string }) {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["fonti-stato"],
    queryFn: fetchFontiStato,
    refetchInterval: 60_000,
  });
  const rows = [...(data ?? [])].sort((a, b) => a.fonte.localeCompare(b.fonte));

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <h2 className="mb-3 text-xl font-bold">{t("admin.updates")}</h2>
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">{t("admin.source")}</th>
              <th className="py-2 pr-3">{t("admin.state")}</th>
              <th className="py-2 pr-3">{t("admin.lastOk")}</th>
              <th className="py-2 pr-3">{t("admin.lastTry")}</th>
              <th className="py-2">{t("admin.errors")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const streak = f.fail_streak ?? 0;
              return (
                <tr key={f.fonte} className="border-t border-border/60 align-top">
                  <td className="py-2 pr-3 font-semibold">{f.fonte}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-bold " +
                        (f.ok
                          ? "bg-status-green text-status-green-foreground"
                          : "bg-status-red text-status-red-foreground")
                      }
                    >
                      {f.ok ? "OK" : "ERR"}
                    </span>
                    {f.error ? (
                      <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">{f.error}</p>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">
                    {f.last_success_at ? new Date(f.last_success_at).toLocaleString(locale) : "—"}
                  </td>
                  <td className="py-2 pr-3">{new Date(f.fetched_at).toLocaleString(locale)}</td>
                  <td
                    className={
                      "py-2 font-bold " + (streak >= STALE_AFTER_FAILURES ? "text-status-red" : "")
                    }
                  >
                    {streak}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Area riservata · Golfo Dianese Live" },
      { name: "description", content: "Pannello di aggiornamento dati per Golfo Dianese Live." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Area riservata · Golfo Dianese Live" },
      { property: "og:description", content: "Pannello di aggiornamento dati per Golfo Dianese Live." },
    ],
  }),
  component: AdminPage,
});

function LoginForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  return (
    <form onSubmit={submit} className="mx-auto grid w-full max-w-sm gap-3 rounded-3xl border border-border bg-card p-6">
      <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
      <label className="grid gap-1 text-sm font-semibold">
        {t("admin.email")}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2 text-base font-normal"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        {t("admin.password")}
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2 text-base font-normal"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {t("admin.login")}
      </button>
      <Link to="/" className="text-center text-sm underline">
        {t("admin.back")}
      </Link>
    </form>
  );
}

function Panel() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const bathing = useQuery({ queryKey: ["bathing-water"], queryFn: fetchBathingWater });
  const advisories = useQuery({ queryKey: ["water-advisories"], queryFn: fetchWaterAdvisories });
  const bike = useQuery({ queryKey: ["bike-path"], queryFn: fetchBikePath });

  const [newAdvisory, setNewAdvisory] = useState({
    zone: "",
    kind: "planned",
    description: "",
    expected_restore_at: "",
  });

  async function saveBathing(id: string, status: string, last_sampled_on: string) {
    const { error } = await supabase
      .from("bathing_water")
      .update({ status, last_sampled_on: last_sampled_on || null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OK");
    qc.invalidateQueries({ queryKey: ["bathing-water"] });
  }

  async function addAdvisory() {
    if (!newAdvisory.zone) return toast.error("Zona obbligatoria");
    const { error } = await supabase.from("water_advisories").insert({
      zone: newAdvisory.zone,
      kind: newAdvisory.kind,
      description: newAdvisory.description || null,
      expected_restore_at: newAdvisory.expected_restore_at
        ? new Date(newAdvisory.expected_restore_at).toISOString()
        : null,
    });
    if (error) return toast.error(error.message);
    setNewAdvisory({ zone: "", kind: "planned", description: "", expected_restore_at: "" });
    toast.success("OK");
    qc.invalidateQueries({ queryKey: ["water-advisories"] });
  }

  async function removeAdvisory(id: string) {
    const { error } = await supabase.from("water_advisories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["water-advisories"] });
  }

  async function saveBike(id: string, status: string, message_it: string, message_en: string) {
    const { error } = await supabase
      .from("bike_path_status")
      .update({ status, message_it, message_en })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OK");
    qc.invalidateQueries({ queryKey: ["bike-path"] });
  }

  const input = "w-full rounded-xl border border-input bg-background px-3 py-2";
  const card = "rounded-3xl border border-border bg-card p-5";
  const btn = "rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground";

  return (
    <div className="grid gap-5">
      <UpdateStatusPanel locale={lang} />
      <ReportsQueue locale={lang} />
      <section className={card}>
        <h2 className="mb-3 text-xl font-bold">{t("card.bathing")}</h2>
        {(bathing.data ?? []).map((b) => (
          <form
            key={b.id}
            className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              saveBathing(b.id, String(f.get("status")), String(f.get("date")));
            }}
          >
            <label className="grid gap-1 text-sm font-semibold">
              {b.beach_name}
              <select name="status" defaultValue={b.status} className={input}>
                <option value="compliant">Conforme</option>
                <option value="non_compliant">Non conforme</option>
                <option value="unknown">Non disponibile</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t("bathing.lastSample")}
              <input type="date" name="date" defaultValue={b.last_sampled_on ?? ""} className={input} />
            </label>
            <button className={btn}>{t("admin.save")}</button>
          </form>
        ))}
      </section>

      <section className={card}>
        <h2 className="mb-3 text-xl font-bold">{t("card.water")}</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <input
            placeholder={t("water.zone")}
            value={newAdvisory.zone}
            onChange={(e) => setNewAdvisory({ ...newAdvisory, zone: e.target.value })}
            className={input}
          />
          <select
            value={newAdvisory.kind}
            onChange={(e) => setNewAdvisory({ ...newAdvisory, kind: e.target.value })}
            className={input}
          >
            <option value="planned">{t("water.kind.planned")}</option>
            <option value="outage">{t("water.kind.outage")}</option>
            <option value="works">{t("water.kind.works")}</option>
          </select>
          <input
            placeholder="Descrizione"
            value={newAdvisory.description}
            onChange={(e) => setNewAdvisory({ ...newAdvisory, description: e.target.value })}
            className={input}
          />
          <input
            type="datetime-local"
            value={newAdvisory.expected_restore_at}
            onChange={(e) => setNewAdvisory({ ...newAdvisory, expected_restore_at: e.target.value })}
            className={input}
          />
          <button type="button" onClick={addAdvisory} className={btn}>
            {t("admin.add")}
          </button>
        </div>
        <ul className="grid gap-2">
          {(advisories.data ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 p-3">
              <span className="text-sm">
                <strong>{a.zone}</strong> · {t(`water.kind.${a.kind}`)}
              </span>
              <button onClick={() => removeAdvisory(a.id)} className="text-sm font-semibold text-destructive">
                {t("admin.delete")}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="mb-3 text-xl font-bold">{t("mobility.bike")}</h2>
        {(bike.data ?? []).map((p) => (
          <form
            key={p.id}
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              saveBike(p.id, String(f.get("status")), String(f.get("it")), String(f.get("en")));
            }}
          >
            <select name="status" defaultValue={p.status} className={input}>
              <option value="open">{t("mobility.bike.open")}</option>
              <option value="works">{t("mobility.bike.works")}</option>
              <option value="closed">{t("mobility.bike.closed")}</option>
            </select>
            <textarea name="it" defaultValue={p.message_it ?? ""} className={input} rows={2} />
            <textarea name="en" defaultValue={p.message_en ?? ""} className={input} rows={2} />
            <button className={btn}>{t("admin.save")}</button>
          </form>
        ))}
      </section>
    </div>
  );
}

function AdminPage() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [session]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="surface-sea px-5 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <h1 className="text-xl font-bold">{t("admin.title")}</h1>
          {session ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="rounded-full bg-primary-foreground/20 px-4 py-1.5 text-sm font-semibold"
            >
              {t("admin.logout")}
            </button>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        {!ready ? (
          <p className="text-muted-foreground">{t("app.loading")}</p>
        ) : !session ? (
          <LoginForm />
        ) : !isAdmin ? (
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="mb-3">{t("admin.noAccess")}</p>
            <Link to="/" className="underline">
              {t("admin.back")}
            </Link>
          </div>
        ) : (
          <Panel />
        )}
      </main>
    </div>
  );
}
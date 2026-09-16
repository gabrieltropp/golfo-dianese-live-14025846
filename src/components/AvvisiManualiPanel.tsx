import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { COMUNI_AVVISI, type Avviso } from "@/lib/civic-data";

const input = "w-full rounded-xl border border-input bg-background px-3 py-2";
const card = "rounded-3xl border border-border bg-card p-5";
const btn = "rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground";

/** Etichetta di fonte scritta su ogni avviso inserito qui: distingue questi
 *  record da quelli letti automaticamente, pur restando nella stessa tabella. */
const FONTE_MANUALE = "Inserimento manuale";

type NewAvviso = {
  comune: string;
  titolo: string;
  testo_breve: string;
  url: string;
  data_pubblicazione: string; // yyyy-mm-dd, dal campo <input type="date">
  categoria: string;
};

const EMPTY: NewAvviso = {
  comune: "Diano Castello",
  titolo: "",
  testo_breve: "",
  url: "",
  data_pubblicazione: "",
  categoria: "",
};

/**
 * Inserimento manuale di avvisi per i comuni privi di lettura automatica —
 * oggi solo Diano Castello, che non ha un sito raggiungibile per lo
 * scraping. Scrive nella stessa tabella "avvisi" usata dalla lettura
 * automatica degli altri comuni: un avviso inserito qui compare esattamente
 * dove compaiono quelli letti in automatico (scheda "Comuni", bacheca),
 * indistinguibile per chi legge il sito — solo il campo "fonte" lo
 * identifica internamente come inserito a mano.
 */
export function AvvisiManualiPanel({ locale }: { locale: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<NewAvviso>(EMPTY);

  const manuali = useQuery({
    queryKey: ["avvisi-manuali-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avvisi")
        .select("*")
        .eq("fonte", FONTE_MANUALE)
        .order("data_pubblicazione", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Avviso[];
    },
  });

  async function addAvviso() {
    if (!form.titolo.trim()) return toast.error("Titolo obbligatorio");
    if (!form.comune) return toast.error("Comune obbligatorio");
    if (!form.url.trim()) {
      return toast.error("Link obbligatorio (va bene anche un post Facebook o un documento)");
    }
    const { error } = await supabase.from("avvisi").insert({
      fonte: FONTE_MANUALE,
      comune: form.comune,
      titolo: form.titolo.trim(),
      testo_breve: form.testo_breve.trim() || null,
      url: form.url.trim(),
      data_pubblicazione: form.data_pubblicazione
        ? new Date(form.data_pubblicazione).toISOString()
        : null,
      categoria: form.categoria.trim() || "Avviso",
      fetched_at: new Date().toISOString(),
      necessita_revisione: !form.data_pubblicazione,
    });
    if (error) return toast.error(error.message);
    setForm(EMPTY);
    toast.success("Avviso pubblicato");
    qc.invalidateQueries({ queryKey: ["avvisi-manuali-admin"] });
    qc.invalidateQueries({ queryKey: ["avvisi"] });
  }

  async function removeAvviso(id: string) {
    const { error } = await supabase.from("avvisi").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rimosso");
    qc.invalidateQueries({ queryKey: ["avvisi-manuali-admin"] });
    qc.invalidateQueries({ queryKey: ["avvisi"] });
  }

  return (
    <section className={card}>
      <h2 className="mb-1 text-xl font-bold">Avvisi inseriti a mano</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Per i comuni senza lettura automatica — oggi solo Diano Castello, che non ha un sito
        raggiungibile. L'avviso comparirà nella scheda "Comuni" insieme a quelli letti in
        automatico dagli altri comuni.
      </p>

      <form
        className="mb-6 grid gap-2 rounded-2xl border border-border/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          addAvviso();
        }}
      >
        <select
          value={form.comune}
          onChange={(e) => setForm({ ...form, comune: e.target.value })}
          className={input}
        >
          {COMUNI_AVVISI.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          placeholder="Titolo *"
          value={form.titolo}
          onChange={(e) => setForm({ ...form, titolo: e.target.value })}
          className={input}
        />
        <textarea
          placeholder="Testo breve (facoltativo)"
          value={form.testo_breve}
          onChange={(e) => setForm({ ...form, testo_breve: e.target.value })}
          className={input}
          rows={3}
        />
        <input
          placeholder="Link * (es. post Facebook, foto della bacheca comunale, documento)"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className={input}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={form.data_pubblicazione}
            onChange={(e) => setForm({ ...form, data_pubblicazione: e.target.value })}
            className={input}
          />
          <input
            placeholder="Categoria (es. Avviso, Ordinanza)"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className={input}
          />
        </div>
        <button className={btn}>Pubblica avviso</button>
      </form>

      <div className="grid gap-2">
        {(manuali.data ?? []).map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 p-3"
          >
            <div>
              <p className="text-sm font-semibold">
                {a.titolo} · <span className="text-muted-foreground">{a.comune}</span>
              </p>
              {a.data_pubblicazione ? (
                <p className="text-xs text-muted-foreground">
                  {new Date(a.data_pubblicazione).toLocaleDateString(locale)}
                </p>
              ) : null}
            </div>
            <button
              onClick={() => removeAvviso(a.id)}
              className="shrink-0 text-sm font-semibold text-destructive"
            >
              Rimuovi
            </button>
          </div>
        ))}
        {manuali.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun avviso manuale al momento.</p>
        ) : null}
      </div>
    </section>
  );
}

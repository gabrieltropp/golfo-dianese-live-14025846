import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchChiusure } from "@/lib/civic-data";

const input = "w-full rounded-xl border border-input bg-background px-3 py-2";
const card = "rounded-3xl border border-border bg-card p-5";
const btn = "rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground";

const EMPTY = { strada: "Via Aurelia (SS1)", luogo: "", data_inizio: "", data_fine: "", nota: "" };

/** Inserimento manuale delle chiusure stradali, mostrate nella scheda Mobilità. */
export function ChiusureStradePanel({ locale }: { locale: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const list = useQuery({ queryKey: ["chiusure-admin"], queryFn: () => fetchChiusure(true) });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["chiusure-admin"] });
    qc.invalidateQueries({ queryKey: ["chiusure"] });
  };

  async function add() {
    if (!form.strada.trim() || !form.luogo.trim()) return toast.error("Strada e luogo obbligatori");
    if (!form.data_inizio) return toast.error("Data di inizio obbligatoria");
    if (form.data_fine && form.data_fine < form.data_inizio)
      return toast.error("La fine deve essere dopo l'inizio");
    const { error } = await supabase.from("chiusure_strade").insert({
      strada: form.strada.trim(),
      luogo: form.luogo.trim(),
      data_inizio: new Date(form.data_inizio).toISOString(),
      data_fine: form.data_fine ? new Date(form.data_fine).toISOString() : null,
      nota: form.nota.trim() || null,
    });
    if (error) return toast.error(error.message);
    setForm(EMPTY);
    toast.success("Chiusura pubblicata");
    refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("chiusure_strade").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });

  return (
    <section className={card}>
      <h2 className="mb-1 text-xl font-bold">Chiusure stradali</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Compaiono nella scheda Mobilità dal momento della pubblicazione fino alla data di fine.
      </p>
      <form
        className="mb-6 grid gap-2 rounded-2xl border border-border/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input placeholder="Strada *" value={form.strada} onChange={(e) => setForm({ ...form, strada: e.target.value })} className={input} />
        <input placeholder="Luogo * (es. Cervo, galleria Capo Cervo)" value={form.luogo} onChange={(e) => setForm({ ...form, luogo: e.target.value })} className={input} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            Inizio *
            <input type="datetime-local" value={form.data_inizio} onChange={(e) => setForm({ ...form, data_inizio: e.target.value })} className={input} />
          </label>
          <label className="text-xs text-muted-foreground">
            Fine
            <input type="datetime-local" value={form.data_fine} onChange={(e) => setForm({ ...form, data_fine: e.target.value })} className={input} />
          </label>
        </div>
        <textarea placeholder="Nota (es. deviazione consigliata)" rows={2} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} className={input} />
        <button className={btn}>Pubblica chiusura</button>
      </form>
      <div className="grid gap-2">
        {(list.data ?? []).map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-semibold">{c.strada} · {c.luogo}</p>
              <p className="text-xs text-muted-foreground">
                {fmt(c.data_inizio)}{c.data_fine ? ` → ${fmt(c.data_fine)}` : ""}
              </p>
            </div>
            <button onClick={() => remove(c.id)} className="shrink-0 text-sm font-semibold text-destructive">Rimuovi</button>
          </div>
        ))}
        {list.data?.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna chiusura inserita.</p> : null}
      </div>
    </section>
  );
}

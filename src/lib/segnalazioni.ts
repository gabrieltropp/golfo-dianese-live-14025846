import { supabase } from "@/integrations/supabase/client";

export const SEGNALAZIONI_COMUNI = ["Diano Marina", "San Bartolomeo al Mare", "Cervo"] as const;
export const SEGNALAZIONI_CATEGORIE = ["viabilita", "acqua", "eventi", "sicurezza", "altro"] as const;

export type Segnalazione = {
  id: string;
  comune: string;
  categoria: string | null;
  testo: string;
  foto_url: string | null;
  stato: "in_attesa" | "verificata" | "rifiutata";
  fonte_verifica_url: string | null;
  data_invio: string;
  data_verifica: string | null;
};

export type SegnalazioneAdmin = Segnalazione & {
  contatto: string | null;
  note_moderazione: string | null;
};

const PUBLIC_COLUMNS =
  "id, comune, categoria, testo, foto_url, stato, fonte_verifica_url, data_invio, data_verifica";

/** Public read: only verified reports, never the reporter's contact. */
export async function fetchSegnalazioniVerificate(): Promise<Segnalazione[]> {
  const { data, error } = await supabase
    .from("segnalazioni")
    .select(PUBLIC_COLUMNS)
    .eq("stato", "verificata")
    .order("data_verifica", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Segnalazione[];
}

/** Admin moderation queue: oldest first so nothing is left behind. */
export async function fetchSegnalazioniInAttesa(): Promise<SegnalazioneAdmin[]> {
  const { data, error } = await supabase
    .from("segnalazioni")
    .select("*")
    .eq("stato", "in_attesa")
    .order("data_invio", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as SegnalazioneAdmin[];
}

export async function submitSegnalazione(form: FormData): Promise<void> {
  const res = await fetch("/api/public/segnala", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? "submit_failed");
}

export function segnalazioniOf(list: Segnalazione[] | undefined, comune: string): Segnalazione[] {
  return (list ?? [])
    .filter((s) => s.comune === comune)
    .sort(
      (a, b) =>
        new Date(b.data_verifica ?? b.data_invio).getTime() -
        new Date(a.data_verifica ?? a.data_invio).getTime(),
    );
}
ALTER VIEW public.segnalazioni_pubbliche SET (security_invoker = on, security_barrier = true);

-- Column-level grant: anon may never read contatto / ip_hash / note_moderazione
GRANT SELECT (id, comune, categoria, testo, foto_url, stato, fonte_verifica_url, data_invio, data_verifica)
  ON public.segnalazioni TO anon;

CREATE POLICY "Public can read verified reports"
ON public.segnalazioni FOR SELECT TO anon
USING (stato = 'verificata');

DROP POLICY IF EXISTS "Public can read verified reports" ON public.segnalazioni;

REVOKE SELECT ON public.segnalazioni FROM anon;

CREATE OR REPLACE VIEW public.segnalazioni_pubbliche AS
  SELECT id, comune, categoria, testo, foto_url, stato, fonte_verifica_url, data_invio, data_verifica
  FROM public.segnalazioni
  WHERE stato = 'verificata';

ALTER VIEW public.segnalazioni_pubbliche SET (security_barrier = true);

GRANT SELECT ON public.segnalazioni_pubbliche TO anon, authenticated;

CREATE POLICY "Admins can read report photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'segnalazioni' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage report photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'segnalazioni' AND public.is_admin(auth.uid()));

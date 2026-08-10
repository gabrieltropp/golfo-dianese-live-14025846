-- 1) Remove anon direct read of base table (exposes contatto/ip_hash)
DROP POLICY IF EXISTS "Public can read verified reports" ON public.segnalazioni;
REVOKE ALL ON public.segnalazioni FROM anon;

-- Public reads go through the safe-column view only
ALTER VIEW public.segnalazioni_pubbliche SET (security_invoker = off, security_barrier = true);
GRANT SELECT ON public.segnalazioni_pubbliche TO anon, authenticated;

-- 2) Explicit storage INSERT/UPDATE policies for report photos
DROP POLICY IF EXISTS "Admins can upload report photos" ON storage.objects;
CREATE POLICY "Admins can upload report photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'segnalazioni' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update report photos" ON storage.objects;
CREATE POLICY "Admins can update report photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'segnalazioni' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'segnalazioni' AND public.is_admin(auth.uid()));
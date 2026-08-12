DROP POLICY IF EXISTS "Public can read verified reports" ON public.segnalazioni;
REVOKE ALL ON public.segnalazioni FROM anon;
ALTER VIEW public.segnalazioni_pubbliche SET (security_invoker = off, security_barrier = true);
ALTER VIEW public.segnalazioni_pubbliche OWNER TO postgres;
GRANT SELECT ON public.segnalazioni_pubbliche TO anon, authenticated;
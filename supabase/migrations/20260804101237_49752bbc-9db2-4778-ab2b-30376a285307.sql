CREATE TABLE public.segnalazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comune text NOT NULL,
  categoria text,
  testo text NOT NULL,
  foto_url text,
  contatto text,
  stato text NOT NULL DEFAULT 'in_attesa',
  fonte_verifica_url text,
  note_moderazione text,
  ip_hash text,
  data_invio timestamptz NOT NULL DEFAULT now(),
  data_verifica timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX segnalazioni_stato_idx ON public.segnalazioni (stato, data_invio DESC);
CREATE INDEX segnalazioni_ip_idx ON public.segnalazioni (ip_hash, data_invio DESC);

GRANT SELECT (id, comune, categoria, testo, foto_url, stato, fonte_verifica_url, data_invio, data_verifica) ON public.segnalazioni TO anon, authenticated;
GRANT UPDATE, DELETE ON public.segnalazioni TO authenticated;
GRANT ALL ON public.segnalazioni TO service_role;

ALTER TABLE public.segnalazioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read verified reports" ON public.segnalazioni
  FOR SELECT TO anon, authenticated USING (stato = 'verificata');

CREATE POLICY "Admins can read all reports" ON public.segnalazioni
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update reports" ON public.segnalazioni
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete reports" ON public.segnalazioni
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER set_segnalazioni_updated_at BEFORE UPDATE ON public.segnalazioni
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

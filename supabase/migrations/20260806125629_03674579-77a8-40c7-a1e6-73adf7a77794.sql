CREATE TABLE public.traduzioni (
  contenuto_id text NOT NULL,
  campo text NOT NULL,
  lingua text NOT NULL,
  hash_sorgente text NOT NULL,
  testo_tradotto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contenuto_id, campo, lingua)
);

GRANT SELECT ON public.traduzioni TO anon;
GRANT SELECT ON public.traduzioni TO authenticated;
GRANT ALL ON public.traduzioni TO service_role;

ALTER TABLE public.traduzioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read traduzioni" ON public.traduzioni
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage traduzioni" ON public.traduzioni
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER set_traduzioni_updated_at BEFORE UPDATE ON public.traduzioni
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.fonti_stato ADD COLUMN IF NOT EXISTS anomalia text;
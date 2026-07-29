CREATE TABLE public.avvisi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte text NOT NULL,
  comune text NOT NULL,
  titolo text NOT NULL,
  testo_breve text,
  url text NOT NULL UNIQUE,
  data_pubblicazione timestamptz,
  categoria text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avvisi TO anon;
GRANT SELECT ON public.avvisi TO authenticated;
GRANT ALL ON public.avvisi TO service_role;
ALTER TABLE public.avvisi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read avvisi" ON public.avvisi FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage avvisi" ON public.avvisi FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER set_avvisi_updated_at BEFORE UPDATE ON public.avvisi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX avvisi_comune_data_idx ON public.avvisi (comune, data_pubblicazione DESC);

CREATE TABLE public.punti_balneazione (
  codice_acqua text PRIMARY KEY,
  comune text NOT NULL,
  nome_punto text NOT NULL,
  ordine_costa integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.punti_balneazione TO anon;
GRANT SELECT ON public.punti_balneazione TO authenticated;
GRANT ALL ON public.punti_balneazione TO service_role;
ALTER TABLE public.punti_balneazione ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read punti" ON public.punti_balneazione FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage punti" ON public.punti_balneazione FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER set_punti_updated_at BEFORE UPDATE ON public.punti_balneazione FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.balneazione_stato (
  codice_acqua text PRIMARY KEY REFERENCES public.punti_balneazione(codice_acqua) ON DELETE CASCADE,
  stato text NOT NULL DEFAULT 'unknown',
  stato_raw text,
  classificazione text,
  motivo text,
  anno integer,
  data_ultimo_controllo date,
  source_url text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.balneazione_stato TO anon;
GRANT SELECT ON public.balneazione_stato TO authenticated;
GRANT ALL ON public.balneazione_stato TO service_role;
ALTER TABLE public.balneazione_stato ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read balneazione stato" ON public.balneazione_stato FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage balneazione stato" ON public.balneazione_stato FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER set_balneazione_stato_updated_at BEFORE UPDATE ON public.balneazione_stato FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.fonti_stato (
  fonte text PRIMARY KEY,
  ok boolean NOT NULL DEFAULT true,
  error text,
  items integer NOT NULL DEFAULT 0,
  last_success_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fonti_stato TO anon;
GRANT SELECT ON public.fonti_stato TO authenticated;
GRANT ALL ON public.fonti_stato TO service_role;
ALTER TABLE public.fonti_stato ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read fonti stato" ON public.fonti_stato FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage fonti stato" ON public.fonti_stato FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER set_fonti_stato_updated_at BEFORE UPDATE ON public.fonti_stato FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();